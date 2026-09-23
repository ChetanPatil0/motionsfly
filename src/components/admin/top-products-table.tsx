import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

type TopProduct = { productId: string | null; title: string; unitsSold: number; revenue: number };

export function TopProductsTable({ data }: { data: TopProduct[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-foreground">Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No sales data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 text-right font-medium">Units Sold</th>
                <th className="pb-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.productId ?? p.title} className="border-t">
                  <td className="py-2 font-medium">{p.title}</td>
                  <td className="py-2 text-right">{p.unitsSold}</td>
                  {/* Revenue snapshot amounts may mix currencies at the item level in a real multi-currency
                      catalog; displayed as-is per order-item snapshot currency for simplicity here. */}
                  <td className="py-2 text-right">{formatMoney(p.revenue, "INR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
