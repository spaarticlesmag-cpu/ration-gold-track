import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RationItemProps {
  id: string;
  name: string;
  price: number;
  image: string;
  available: number;
  unit: string;
  subsidized?: boolean;
  onAddToCart: (id: string, quantity: number) => void;
  onRemoveFromCart: (id: string, quantity: number) => void;
  cartQuantity?: number;
}

export const RationItem = ({
  id,
  name,
  price,
  image,
  available,
  unit,
  subsidized = true,
  onAddToCart,
  onRemoveFromCart,
  cartQuantity = 0,
}: RationItemProps) => {
  const handleAdd = () => {
    if (cartQuantity < available) {
      onAddToCart(id, 1);
    }
  };

  const handleRemove = () => {
    if (cartQuantity > 0) {
      onRemoveFromCart(id, 1);
    }
  };

  const isOutOfStock = available === 0;
  const canAddMore = cartQuantity < available;

  return (
    <Card className="shadow-soft hover:shadow-gold transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="relative">
          <img
            src={image}
            alt={name}
            className="w-full h-32 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300"
          />
          {subsidized && (
            <Badge className="absolute top-2 right-2 bg-gold text-foreground">
              Subsidized
            </Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base">{name}</h3>
            <p className="text-sm text-muted-foreground">
              Available: {available} {unit}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-primary">
              ₹{price.toFixed(2)}
              <span className="text-sm text-muted-foreground ml-1">
                per {unit}
              </span>
            </div>
          </div>

          {!isOutOfStock && (
            <div className="flex items-center justify-between">
              {cartQuantity === 0 ? (
                <Button
                  onClick={handleAdd}
                  variant="gold"
                  className="w-full"
                  disabled={!canAddMore}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Cart
                </Button>
              ) : (
                <div className="flex items-center space-x-3 w-full">
                  <Button
                    onClick={handleRemove}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-sm font-medium">
                      {cartQuantity} {unit} in cart
                    </span>
                  </div>
                  <Button
                    onClick={handleAdd}
                    variant="gold"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canAddMore}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {cartQuantity >= available && available > 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Maximum quota reached
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};