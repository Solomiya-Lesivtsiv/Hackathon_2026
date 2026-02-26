import { useState, useEffect, useCallback } from "react";
import { MapPin, DollarSign, Calendar, Navigation } from "lucide-react";
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
  const [timestamp, setTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [taxCalculation, setTaxCalculation] = useState<TaxPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  // Debounced tax calculation via API
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const sub = parseFloat(subtotal);

    if (isNaN(lat) || isNaN(lng) || isNaN(sub) || sub <= 0) {
      setTaxCalculation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const result = await calculateTax(lat, lng, sub);
        setTaxCalculation(result);
      } catch (err) {
        console.error("Tax calc error:", err);
        setTaxCalculation(null);
      } finally {
        setCalcLoading(false);
      }
    }, 400); // debounce 400ms

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
          <div className="text-sm">Order ID: {order.id}</div>
        </div>,
        { duration: 4000 }
      );

      // Reset form
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

  const isValidCoordinate = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="mb-2">Create New Order</h1>
        <p className="text-muted-foreground">
          Manually add a single drone delivery order with automatic tax calculation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="latitude" className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 40.712776"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  className="bg-input-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Delivery location latitude (NY State: 40.5 - 45.0)
                </p>
              </div>

              <div>
                <Label htmlFor="longitude" className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. -73.989421"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="bg-input-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Delivery location longitude (NY State: -80.0 - -71.0)
                </p>
              </div>

              <div>
                <Label htmlFor="subtotal" className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Subtotal ($)
                </Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 50.00"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  required
                  className="bg-input-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Order amount before tax
                </p>
              </div>

              <div>
                <Label htmlFor="timestamp" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Timestamp
                </Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  required
                  className="bg-input-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Order delivery date and time
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting || !taxCalculation}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {submitting ? "Creating Order..." : "Create Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Map Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Location Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {isValidCoordinate ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Simple NY State outline mockup */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 200 120" className="w-full h-full opacity-20">
                      <path
                        d="M20,60 L40,50 L60,45 L80,40 L100,42 L120,50 L140,55 L160,58 L170,62 L175,70 L172,80 L165,85 L150,88 L130,90 L110,88 L90,85 L70,82 L50,78 L35,72 L25,68 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="relative z-10 text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                    <div className="font-mono text-sm">
                      <div>{parseFloat(latitude).toFixed(6)}</div>
                      <div>{parseFloat(longitude).toFixed(6)}</div>
                    </div>
                    {taxCalculation && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {taxCalculation.jurisdiction}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Enter coordinates to preview location</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Calculation Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculation {calcLoading && <span className="text-xs text-muted-foreground ml-2">calculating...</span>}</CardTitle>
            </CardHeader>
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
                      <span className="text-muted-foreground">MCTD Surcharge ({taxCalculation.taxBreakdown.special.rate}%)</span>
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
                      <span className="font-bold" style={{ color: '#22C55E' }}>
                        ${taxCalculation.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {!latitude || !longitude
                      ? "Enter coordinates to calculate tax"
                      : "Enter subtotal amount"}
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
