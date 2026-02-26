from models import TaxBreakdown
from typing import Tuple


class TaxCalculator:
    """
    Tax calculator for New York State based on GPS coordinates.
    Implements realistic NY tax jurisdiction logic.
    """
    
    # New York State tax rate
    NY_STATE_TAX_RATE = 0.04  # 4%
    
    # NY County tax rates (sample data for major counties)
    COUNTY_TAX_RATES = {
        "New York County": 0.045,      # Manhattan
        "Kings County": 0.045,          # Brooklyn
        "Queens County": 0.045,         # Queens
        "Bronx County": 0.045,          # Bronx
        "Richmond County": 0.045,       # Staten Island
        "Nassau County": 0.0425,
        "Suffolk County": 0.0425,
        "Westchester County": 0.04,
        "Erie County": 0.0475,          # Buffalo
        "Monroe County": 0.04,          # Rochester
        "Onondaga County": 0.04,        # Syracuse
        "Albany County": 0.04,          # Albany
    }
    
    # NYC city tax (applies to all 5 boroughs)
    NYC_CITY_TAX_RATE = 0.045  # 4.5%
    
    # Special district tax rates (for specific areas)
    SPECIAL_DISTRICT_RATES = {
        "Manhattan CBD": 0.00375,       # Central Business District
        "JFK Airport Zone": 0.005,
        "Downtown Brooklyn": 0.003,
        "Long Island Surcharge": 0.0025,
    }
    
    def _get_jurisdiction_from_coords(self, latitude: float, longitude: float) -> Tuple[str, str, str, float]:
        """
        Determine jurisdiction (county, city) from GPS coordinates.
        Returns: (county, city, special_district, special_rate)
        
        Real implementation would use geospatial database lookup.
        This is a simplified mock based on coordinate ranges.
        """
        
        # Manhattan (New York County)
        if 40.700 <= latitude <= 40.882 and -74.020 <= longitude <= -73.907:
            if 40.700 <= latitude <= 40.760 and -74.020 <= longitude <= -73.970:
                return ("New York County", "New York", "Manhattan CBD", 0.00375)
            return ("New York County", "New York", "", 0.0)
        
        # Brooklyn (Kings County)
        elif 40.570 <= latitude <= 40.739 and -74.042 <= longitude <= -73.833:
            if 40.690 <= latitude <= 40.705 and -73.995 <= longitude <= -73.980:
                return ("Kings County", "Brooklyn", "Downtown Brooklyn", 0.003)
            return ("Kings County", "Brooklyn", "", 0.0)
        
        # Queens County
        elif 40.541 <= latitude <= 40.800 and -73.962 <= longitude <= -73.700:
            # JFK Airport area
            if 40.635 <= latitude <= 40.660 and -73.800 <= longitude <= -73.760:
                return ("Queens County", "Queens", "JFK Airport Zone", 0.005)
            return ("Queens County", "Queens", "", 0.0)
        
        # Bronx County
        elif 40.785 <= latitude <= 40.915 and -73.933 <= longitude <= -73.748:
            return ("Bronx County", "Bronx", "", 0.0)
        
        # Staten Island (Richmond County)
        elif 40.477 <= latitude <= 40.651 and -74.259 <= longitude <= -74.053:
            return ("Richmond County", "Staten Island", "", 0.0)
        
        # Nassau County (Long Island)
        elif 40.600 <= latitude <= 40.850 and -73.750 <= longitude <= -73.450:
            return ("Nassau County", "Hempstead", "Long Island Surcharge", 0.0025)
        
        # Suffolk County (Long Island)
        elif 40.700 <= latitude <= 41.100 and -73.500 <= longitude <= -71.850:
            return ("Suffolk County", "Huntington", "Long Island Surcharge", 0.0025)
        
        # Westchester County
        elif 40.880 <= latitude <= 41.370 and -73.980 <= longitude <= -73.500:
            return ("Westchester County", "Yonkers", "", 0.0)
        
        # Erie County (Buffalo area)
        elif 42.700 <= latitude <= 43.100 and -79.100 <= longitude <= -78.600:
            return ("Erie County", "Buffalo", "", 0.0)
        
        # Monroe County (Rochester area)
        elif 43.000 <= latitude <= 43.300 and -77.900 <= longitude <= -77.400:
            return ("Monroe County", "Rochester", "", 0.0)
        
        # Albany County
        elif 42.500 <= latitude <= 42.800 and -74.100 <= longitude <= -73.650:
            return ("Albany County", "Albany", "", 0.0)
        
        # Default: Generic NY location
        else:
            return ("Erie County", "Buffalo", "", 0.0)
    
    def _is_nyc(self, county: str) -> bool:
        """Check if the county is part of NYC (5 boroughs)"""
        nyc_counties = [
            "New York County",
            "Kings County",
            "Queens County",
            "Bronx County",
            "Richmond County"
        ]
        return county in nyc_counties
    
    def calculate_tax(self, latitude: float, longitude: float, subtotal: float) -> TaxBreakdown:
        """
        Calculate comprehensive tax breakdown for a given location and amount.
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude
            subtotal: Order subtotal amount
            
        Returns:
            TaxBreakdown object with detailed tax information
        """
        
        # Get jurisdiction info
        county, city, special_district, special_rate = self._get_jurisdiction_from_coords(latitude, longitude)
        
        # Calculate state tax (always applies)
        state_rate = self.NY_STATE_TAX_RATE
        state_tax = subtotal * state_rate
        
        # Calculate county tax
        county_rate = self.COUNTY_TAX_RATES.get(county, 0.04)
        county_tax = subtotal * county_rate
        
        # Calculate city tax (only for NYC)
        city_rate = self.NYC_CITY_TAX_RATE if self._is_nyc(county) else 0.0
        city_tax = subtotal * city_rate
        
        # Calculate special district tax
        special_tax = subtotal * special_rate
        
        # Calculate totals
        total_tax = state_tax + county_tax + city_tax + special_tax
        total_rate = state_rate + county_rate + city_rate + special_rate
        
        # Create jurisdiction description
        jurisdiction_parts = [city, county]
        if special_district:
            jurisdiction_parts.insert(0, special_district)
        jurisdiction = ", ".join(jurisdiction_parts)
        
        return TaxBreakdown(
            state_tax=round(state_tax, 2),
            state_rate=state_rate,
            county_tax=round(county_tax, 2),
            county_rate=county_rate,
            city_tax=round(city_tax, 2),
            city_rate=city_rate,
            special_tax=round(special_tax, 2),
            special_rate=special_rate,
            total_tax=round(total_tax, 2),
            total_rate=round(total_rate, 4),
            jurisdiction=jurisdiction,
            county=county,
            city=city
        )
