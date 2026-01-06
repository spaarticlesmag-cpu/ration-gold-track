import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Truck, Store, CreditCard, DollarSign, MapPin, Navigation } from "lucide-react";
import { getUserLocation, findClosestStores, type RationStore } from "@/lib/store-service";

export default function Cart() {
  const { lines, totalAmount, totalItems, clear } = useCart();
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [closestStores, setClosestStores] = useState<Array<RationStore & { distance: number }>>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load closest stores when pickup is selected
  useEffect(() => {
    if (fulfillmentType === 'pickup' && closestStores.length === 0) {
      loadClosestStores();
    }
  }, [fulfillmentType]);

  const loadClosestStores = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      // Get user's location
      const userLocation = await getUserLocation();

      // Find closest stores
      const stores = findClosestStores(userLocation, 3);
      setClosestStores(stores);

      // Auto-select the closest store
      if (stores.length > 0) {
        setSelectedStore(stores[0].id);
      }
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Unable to get your location');
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalItems === 0 ? (
            <div className="text-center text-muted-foreground">Your cart is empty.</div>
          ) : (
            <>
              {lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-sm text-muted-foreground">{l.quantity} {l.unit} × ₹{l.price}</div>
                  </div>
                  <div className="font-semibold">₹{(l.price * l.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="border-t border-border pt-4 flex items-center justify-between font-bold">
                <div>Total</div>
                <div className="text-primary">₹{totalAmount.toFixed(2)}</div>
              </div>

              {/* Fulfillment Type Selection */}
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  How would you like to receive your order?
                </h3>
                <RadioGroup value={fulfillmentType} onValueChange={(value: "delivery" | "pickup") => setFulfillmentType(value)} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Home Delivery</div>
                        <div className="text-sm text-muted-foreground">Delivered to your address</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Store className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Pickup at Ration Shop</div>
                        <div className="text-sm text-muted-foreground">Collect from nearest shop with QR authentication</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Store Selection for Pickup */}
                {fulfillmentType === 'pickup' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Select Pickup Location
                    </h4>

                    {locationLoading && (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-sm text-green-700">Finding nearest stores...</p>
                      </div>
                    )}

                    {locationError && (
                      <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">
                        {locationError}
                      </div>
                    )}

                    {closestStores.length > 0 && (
                      <div className="space-y-3">
                        <Select value={selectedStore} onValueChange={setSelectedStore}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a store" />
                          </SelectTrigger>
                          <SelectContent>
                            {closestStores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{store.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {store.distance.toFixed(1)} km • {store.address}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedStore && (
                          <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <Navigation className="h-4 w-4" />
                              <span className="font-medium">Selected Store:</span>
                            </div>
                            {(() => {
                              const store = closestStores.find(s => s.id === selectedStore);
                              return store ? (
                                <div>
                                  <div className="font-medium">{store.name}</div>
                                  <div className="text-xs">{store.address}</div>
                                  <div className="text-xs mt-1">
                                    📍 {store.distance.toFixed(1)} km away • 🕒 {store.operating_hours}
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {!locationLoading && closestStores.length === 0 && !locationError && (
                      <Button
                        onClick={loadClosestStores}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Find Nearest Stores
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </h3>
                <RadioGroup value={paymentMethod} onValueChange={(value: "online" | "cod") => setPaymentMethod(value)} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Online Payment</div>
                        <div className="text-sm text-muted-foreground">Pay now securely</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Cash on Delivery/Pickup</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={clear}>Clear Cart</Button>
                <Button asChild variant="premium" className="flex-1">
                  <Link
                    to="/payment"
                    state={{
                      fulfillmentType,
                      paymentMethod,
                      selectedStore: fulfillmentType === 'pickup' ? selectedStore : null,
                      cartData: { lines, totalAmount, totalItems }
                    }}
                  >
                    Proceed to {paymentMethod === 'cod' ? 'Confirmation' : 'Payment'}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </MainLayout>
  );
}
