import { useState, useEffect } from "react";
import { MapPin, DollarSign, Calendar, Navigation, Locate } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { calculateTax, createOrder, type TaxPreview } from "../services/api";
import { toast } from "sonner";

export function CreateOrder() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [taxCalculation, setTaxCalculation] = useState<TaxPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live tax preview via API with debounce
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const sub = parseFloat(subtotal);

    if (isNaN(lat) || isNaN(lng) || isNaN(sub) || sub <= 0) {
      setTaxCalculation(null);
      return;
    }

    const timer = setTimeout(() => {
      calculateTax(lat, lng, sub)
        .then(setTaxCalculation)
        .catch(() => setTaxCalculation(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [latitude, longitude, subtotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude || !subtotal) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        subtotal: parseFloat(subtotal),
        timestamp: new Date(timestamp).toISOString(),
      });
      toast.success(
        <div>
          <div className="font-bold">Order Created Successfully!</div>
          <div className="text-sm">Order ID: {order.id} — Total: ${order.total.toFixed(2)}</div>
        </div>,
        { duration: 4000 }
      );
      setLatitude("");
      setLongitude("");
      setSubtotal("");
      setTimestamp(new Date().toISOString().slice(0, 16));
      setTaxCalculation(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          toast.success("Current location detected");
        },
        () => toast.error("Unable to get your location")
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const isValidCoordinate = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="mb-2">Create New Order</h1>
        <p className="text-muted-foreground">
          Click on the map or enter coordinates to set delivery location with automatic tax calculation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="latitude" className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" /> Latitude
                  </Label>
                  <Input id="latitude" type="number" step="0.000001" placeholder="e.g. 40.712776"
                    value={latitude} onChange={(e) => setLatitude(e.target.value)} required className="bg-input-background" />
                  <p className="text-xs text-muted-foreground mt-1">Delivery location latitude (NY State: 40.5 - 45.0)</p>
                </div>
                <div className="flex-1">
                  <Label htmlFor="longitude" className="flex items-center gap-2 mb-2">
                    <Navigation className="h-4 w-4 text-primary" /> Longitude
                  </Label>
                  <Input id="longitude" type="number" step="0.000001" placeholder="e.g. -73.989421"
                    value={longitude} onChange={(e) => setLongitude(e.target.value)} required className="bg-input-background" />
                  <p className="text-xs text-muted-foreground mt-1">Delivery location longitude (NY State: -80.0 - -71.0)</p>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full gap-2" onClick={handleUseCurrentLocation}>
                <Locate className="h-4 w-4" /> Use Current Location
              </Button>

              <div>
                <Label htmlFor="subtotal" className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Subtotal ($)
                </Label>
                <Input id="subtotal" type="number" step="0.01" min="0.01" placeholder="e.g. 50.00"
                  value={subtotal} onChange={(e) => setSubtotal(e.target.value)} required className="bg-input-background" />
                <p className="text-xs text-muted-foreground mt-1">Order amount before tax</p>
              </div>

              <div>
                <Label htmlFor="timestamp" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" /> Timestamp
                </Label>
                <Input id="timestamp" type="datetime-local" value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)} required className="bg-input-background" />
                <p className="text-xs text-muted-foreground mt-1">Order delivery date and time</p>
              </div>

              <Button type="submit" disabled={submitting || !taxCalculation} className="w-full bg-primary hover:bg-primary/90">
                {submitting ? "Creating Order..." : "Create Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Location Preview</span>
                <span className="text-xs font-normal text-muted-foreground">Enter coordinates above</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                <div className="text-center p-4">
                  {isValidCoordinate ? (
                    <div className="space-y-2">
                      <MapPin className="h-12 w-12 mx-auto text-primary opacity-60" />
                      <div className="font-medium">Delivery Location Set</div>
                      <div className="text-sm text-muted-foreground">
                        {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                      </div>
                      {taxCalculation && (
                        <div className="text-xs text-primary mt-2">{taxCalculation.jurisdiction}</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Navigation className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
                      <div className="text-sm text-muted-foreground">Enter coordinates above or use current location</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tax Calculation</CardTitle></CardHeader>
            <CardContent>
              {taxCalculation ? (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Detected Jurisdiction</div>
                    <div className="font-medium">{taxCalculation.jurisdiction}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">State Tax ({taxCalculation.taxBreakdown.state.rate}%)</span>
                      <span className="font-medium">${taxCalculation.taxBreakdown.state.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">County Tax ({taxCalculation.taxBreakdown.county.rate}%)</span>
                      <span className="font-medium">${taxCalculation.taxBreakdown.county.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">City Tax ({taxCalculation.taxBreakdown.city.rate}%)</span>
                      <span className="font-medium">${taxCalculation.taxBreakdown.city.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Special Tax ({taxCalculation.taxBreakdown.special.rate}%)</span>
                      <span className="font-medium">${taxCalculation.taxBreakdown.special.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Composite Tax Rate</span>
                      <span className="font-bold text-primary">{taxCalculation.taxBreakdown.composite.toFixed(3)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${parseFloat(subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Tax Amount</span>
                      <span className="font-medium">${taxCalculation.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#22C55E]/10 rounded-lg">
                      <span className="font-medium">Total Amount</span>
                      <span className="font-bold" style={{ color: '#22C55E' }}>${taxCalculation.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {!latitude || !longitude ? "Enter coordinates to calculate tax" : "Enter subtotal amount"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
