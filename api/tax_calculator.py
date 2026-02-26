"""
NY State Sales Tax Calculator based on GPS coordinates.

Source: Publication 718 – NY State Sales and Use Tax Rates by Jurisdiction
        Effective March 1, 2025
        https://www.tax.ny.gov/pdf/publications/sales/pub718.pdf

Tax structure:
  composite_rate = state_rate + local_rate + mctd_surcharge

  - state_rate:      always 4%
  - local_rate:      county/city tax (varies by jurisdiction)
  - mctd_surcharge:  0.375% in the Metropolitan Commuter Transportation
                     District (NYC + Dutchess, Nassau, Orange, Putnam,
                     Rockland, Suffolk, Westchester counties)

Assumptions documented in README:
  - Jurisdiction is determined by approximate bounding-box polygons of
    NY counties, checked from most-specific (NYC boroughs) to least.
  - For coordinates that don't match any known county we fall back to
    NY state-only rate (4%) which is the legal minimum.
  - Wellness kits are tangible personal property subject to standard
    sales tax (no special exemption).
"""

from models import TaxBreakdown, TaxComponent, Jurisdiction
from typing import Tuple, List


# ── Constants ───────────────────────────────────────────────────────────────

NY_STATE_RATE = 4.0          # percent
MCTD_SURCHARGE = 0.375       # percent

# Counties that are inside the MCTD
MCTD_COUNTIES = {
    "New York County",       # Manhattan
    "Kings County",          # Brooklyn
    "Queens County",
    "Bronx County",
    "Richmond County",       # Staten Island
    "Nassau County",
    "Suffolk County",
    "Westchester County",
    "Rockland County",
    "Putnam County",
    "Dutchess County",
    "Orange County",
}

# NYC boroughs — have a unified 4.5% local rate
NYC_COUNTIES = {
    "New York County",
    "Kings County",
    "Queens County",
    "Bronx County",
    "Richmond County",
}

# Local tax rates by county (Publication 718, effective 2025-03-01)
# For NYC the 4.5% is the combined city local rate
COUNTY_LOCAL_RATES = {
    # NYC boroughs — 4.5% local
    "New York County":    4.5,
    "Kings County":       4.5,
    "Queens County":      4.5,
    "Bronx County":       4.5,
    "Richmond County":    4.5,
    # MCTD suburban
    "Nassau County":      4.25,
    "Suffolk County":     4.375,   # increased 2025-03-01
    "Westchester County": 4.0,
    "Rockland County":    4.0,
    "Putnam County":      4.0,
    "Dutchess County":    3.75,
    "Orange County":      3.75,
    # Upstate (not in MCTD)
    "Erie County":        4.75,    # Buffalo
    "Monroe County":      4.0,     # Rochester
    "Albany County":       4.0,
    "Onondaga County":    4.0,     # Syracuse
    "Ontario County":     3.5,
    "Saratoga County":    3.0,
    "Broome County":      4.0,     # Binghamton
    "Oneida County":      4.75,    # Utica
    "Schenectady County": 4.0,
    "Rensselaer County":  4.0,
    "Tompkins County":    4.0,     # Ithaca
    "Ulster County":      4.0,
}

# Yonkers has its own combined rate of 8.875% (same as NYC)
# i.e. local = 4.5%.  We handle this as a special city override.
CITY_OVERRIDES = {
    # (county, city_name): local_rate
    ("Westchester County", "Yonkers"): 4.5,
}

# Human-friendly city names for each county
COUNTY_CITY_NAMES = {
    "New York County":    "New York City",
    "Kings County":       "New York City",
    "Queens County":      "New York City",
    "Bronx County":       "New York City",
    "Richmond County":    "New York City",
    "Nassau County":      "Hempstead",
    "Suffolk County":     "Babylon",
    "Westchester County": "White Plains",
    "Rockland County":    "New City",
    "Putnam County":      "Carmel",
    "Dutchess County":    "Poughkeepsie",
    "Orange County":      "Goshen",
    "Erie County":        "Buffalo",
    "Monroe County":      "Rochester",
    "Albany County":       "Albany",
    "Onondaga County":    "Syracuse",
    "Ontario County":     "Canandaigua",
    "Saratoga County":    "Saratoga Springs",
    "Broome County":      "Binghamton",
    "Oneida County":      "Utica",
    "Schenectady County": "Schenectady",
    "Rensselaer County":  "Troy",
    "Tompkins County":    "Ithaca",
    "Ulster County":      "Kingston",
}


# ── Bounding boxes for NY counties ──────────────────────────────────────────
# Order matters: NYC boroughs first (more specific), then suburban, then upstate.
# Each entry: (county_name, lat_min, lat_max, lon_min, lon_max)

COUNTY_BOUNDS = [
    # ─── NYC boroughs ───
    ("New York County",    40.700, 40.882, -74.020, -73.907),   # Manhattan
    ("Bronx County",       40.785, 40.915, -73.933, -73.748),   # Bronx
    ("Kings County",       40.570, 40.739, -74.042, -73.833),   # Brooklyn
    ("Queens County",      40.541, 40.800, -73.962, -73.700),   # Queens
    ("Richmond County",    40.477, 40.651, -74.259, -74.053),   # Staten Island

    # ─── MCTD suburban ───
    ("Nassau County",      40.520, 40.950, -73.750, -73.400),
    ("Suffolk County",     40.600, 41.200, -73.500, -71.850),
    ("Westchester County", 40.880, 41.370, -73.980, -73.500),
    ("Rockland County",    41.040, 41.220, -74.230, -73.890),
    ("Putnam County",      41.370, 41.550, -73.980, -73.520),
    ("Dutchess County",    41.450, 42.080, -73.980, -73.480),
    ("Orange County",      41.150, 41.550, -74.780, -73.980),

    # ─── Upstate ───
    ("Albany County",       42.500, 42.800, -74.100, -73.650),
    ("Erie County",        42.450, 43.100, -79.100, -78.400),
    ("Monroe County",      43.000, 43.350, -77.900, -77.400),
    ("Onondaga County",    42.850, 43.200, -76.450, -75.950),
    ("Ontario County",     42.700, 43.000, -77.400, -76.850),
    ("Saratoga County",    42.900, 43.250, -74.100, -73.600),
    ("Broome County",      42.030, 42.420, -76.150, -75.350),
    ("Oneida County",      42.900, 43.550, -75.800, -75.100),
    ("Schenectady County", 42.700, 42.920, -74.200, -73.850),
    ("Rensselaer County",  42.450, 42.850, -73.700, -73.350),
    ("Tompkins County",    42.250, 42.630, -76.700, -76.250),
    ("Ulster County",      41.580, 42.180, -74.550, -73.900),
]


# ── Calculator ──────────────────────────────────────────────────────────────

def _find_county(lat: float, lon: float) -> str | None:
    """Return county name for given GPS coordinates, or None."""
    for name, lat_min, lat_max, lon_min, lon_max in COUNTY_BOUNDS:
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return name
    return None


def calculate_tax(
    latitude: float,
    longitude: float,
    subtotal: float,
) -> Tuple[TaxBreakdown, List[Jurisdiction]]:
    """
    Calculate composite sales tax for a delivery at (latitude, longitude).

    Returns (TaxBreakdown, list[Jurisdiction]).
    """
    county = _find_county(latitude, longitude)

    # ── Rates ───────────────────────────────────────────────────────────
    state_rate = NY_STATE_RATE                      # always 4%

    if county is None:
        # Unknown location inside NY State — conservative: state only
        local_rate = 0.0
        mctd_rate = 0.0
        county_display = "Unknown County"
        city_display = "Unknown"
    else:
        local_rate = COUNTY_LOCAL_RATES.get(county, 4.0)
        mctd_rate = MCTD_SURCHARGE if county in MCTD_COUNTIES else 0.0
        county_display = county
        city_display = COUNTY_CITY_NAMES.get(county, "")

    # For NYC the "local" rate is really the city rate;
    # for other counties it's the county rate and city = 0.
    if county in NYC_COUNTIES:
        county_rate = 0.0
        city_rate = local_rate      # 4.5%
    else:
        county_rate = local_rate
        city_rate = 0.0

    special_rate = mctd_rate        # MCTD surcharge

    composite = round(state_rate + county_rate + city_rate + special_rate, 3)

    # ── Amounts ─────────────────────────────────────────────────────────
    state_amt   = round(subtotal * state_rate / 100, 2)
    county_amt  = round(subtotal * county_rate / 100, 2)
    city_amt    = round(subtotal * city_rate / 100, 2)
    special_amt = round(subtotal * special_rate / 100, 2)
    tax_amount  = round(state_amt + county_amt + city_amt + special_amt, 2)

    breakdown = TaxBreakdown(
        state=TaxComponent(rate=state_rate, amount=state_amt),
        county=TaxComponent(rate=county_rate, amount=county_amt),
        city=TaxComponent(rate=city_rate, amount=city_amt),
        special=TaxComponent(rate=special_rate, amount=special_amt),
        composite=composite,
    )

    # ── Jurisdictions ───────────────────────────────────────────────────
    jurisdictions: List[Jurisdiction] = [
        Jurisdiction(name="New York", type="State"),
    ]
    if county is not None and county_rate > 0:
        jurisdictions.append(Jurisdiction(name=county_display, type="County"))
    if city_rate > 0:
        jurisdictions.append(Jurisdiction(name=city_display, type="City"))
    if special_rate > 0:
        jurisdictions.append(Jurisdiction(name="MCTD", type="Special"))

    return breakdown, jurisdictions
