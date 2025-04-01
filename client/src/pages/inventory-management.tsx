import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define types based on API schema
type InventoryItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  cost: string;
  supplier: string | null;
  location: string | null;
  lastRestocked: string | null;
  createdAt: string;
  updatedAt: string;
};

type InventoryTransaction = {
  id: number;
  itemId: number;
  quantity: number;
  transactionType: string;
  userId: number;
  notes: string | null;
  serviceRequestId: number | null;
  transactionDate: string;
};

type ServiceRequestItem = {
  id: number;
  serviceRequestId: number;
  itemId: number;
  quantity: number;
  unitCost: string;
  addedAt: string;
};

// Schema for the add inventory item form
const inventoryItemSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().nullable().optional(),
  category: z.string().min(1, { message: "Category is required" }),
  sku: z.string().min(2, { message: "SKU is required" }),
  quantity: z.coerce.number().int().min(0),
  minQuantity: z.coerce.number().int().min(0),
  cost: z.string().min(1, { message: "Cost is required" }),
  supplier: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

// Schema for inventory transaction
const inventoryTransactionSchema = z.object({
  itemId: z.number(),
  quantity: z.coerce.number().int().nonnegative(),
  transactionType: z.string(),
  notes: z.string().nullable().optional(),
});

export default function InventoryManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Fetch inventory data
  const { data: inventoryItems, isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    retry: 1,
  });

  // Fetch low stock items
  const { data: lowStockItems, isLoading: isLoadingLowStock } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
    retry: 1,
  });

  // Form for adding a new inventory item
  const addItemForm = useForm<z.infer<typeof inventoryItemSchema>>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      sku: "",
      quantity: 0,
      minQuantity: 5,
      cost: "",
      supplier: "",
      location: "",
    },
  });

  // Form for adding a transaction
  const addTransactionForm = useForm<z.infer<typeof inventoryTransactionSchema>>({
    resolver: zodResolver(inventoryTransactionSchema),
    defaultValues: {
      itemId: 0,
      quantity: 0,
      transactionType: "restock",
      notes: "",
    },
  });

  // Mutation to add a new inventory item
  const addItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inventoryItemSchema>) => {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to add inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      setIsAddItemOpen(false);
      addItemForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
    },
    onError: (error) => {
      toast({
        title: "Error adding inventory item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to add a transaction
  const addTransactionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inventoryTransactionSchema>) => {
      const response = await fetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to add transaction");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      setIsAddTransactionOpen(false);
      addTransactionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
    },
    onError: (error) => {
      toast({
        title: "Error adding transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handler for adding an item
  const onAddItemSubmit = (data: z.infer<typeof inventoryItemSchema>) => {
    addItemMutation.mutate(data);
  };

  // Submit handler for adding a transaction
  const onAddTransactionSubmit = (data: z.infer<typeof inventoryTransactionSchema>) => {
    addTransactionMutation.mutate(data);
  };

  // Open transaction dialog and set the selected item
  const handleAddTransaction = (item: InventoryItem) => {
    setSelectedItem(item);
    addTransactionForm.setValue("itemId", item.id);
    setIsAddTransactionOpen(true);
  };

  // Generate a format for currency
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  // Loading states
  if (isLoadingInventory || isLoadingLowStock) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="inventory">All Inventory</TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock
            {lowStockItems && Array.isArray(lowStockItems) && lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Inventory Items</h2>
            <Button onClick={() => setIsAddItemOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add New Item
            </Button>
          </div>

          {inventoryItems && Array.isArray(inventoryItems) && inventoryItems.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(inventoryItems) && inventoryItems.map((item: InventoryItem) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            <span className={item.quantity <= item.minQuantity ? "text-red-600 font-bold" : ""}>
                              {item.quantity}
                            </span>
                            {item.quantity <= item.minQuantity && (
                              <AlertTriangle className="h-4 w-4 inline ml-1 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(item.cost)}</TableCell>
                          <TableCell>{item.location || "-"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleAddTransaction(item)}>
                                <Package className="h-4 w-4 mr-2" />
                                Stock
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No inventory items found.</p>
                <Button onClick={() => setIsAddItemOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Item
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="low-stock">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Low Stock Items</h2>
          </div>

          {lowStockItems && Array.isArray(lowStockItems) && lowStockItems.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Quantity</TableHead>
                        <TableHead>Min Quantity</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(lowStockItems) && lowStockItems.map((item: InventoryItem) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-red-600 font-bold">{item.quantity}</TableCell>
                          <TableCell>{item.minQuantity}</TableCell>
                          <TableCell>{formatCurrency(item.cost)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleAddTransaction(item)}>
                              <Package className="h-4 w-4 mr-2" />
                              Restock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>All good!</AlertTitle>
              <AlertDescription>All inventory items have sufficient stock.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for adding new inventory item */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>Fill out the details to add a new item to inventory.</DialogDescription>
          </DialogHeader>
          <Form {...addItemForm}>
            <form onSubmit={addItemForm.handleSubmit(onAddItemSubmit)} className="space-y-4">
              <FormField
                control={addItemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addItemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Item description" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addItemForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="tools">Tools</SelectItem>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="safety">Safety Equipment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addItemForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addItemForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addItemForm.control}
                  name="minQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>For low stock alerts</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addItemForm.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input placeholder="$0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addItemForm.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addItemForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Warehouse location" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addItemMutation.isPending}>
                  {addItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding inventory transaction */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `Update Stock: ${selectedItem.name}` : "Add Transaction"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && `Current stock: ${selectedItem.quantity} units`}
            </DialogDescription>
          </DialogHeader>
          <Form {...addTransactionForm}>
            <form onSubmit={addTransactionForm.handleSubmit(onAddTransactionSubmit)} className="space-y-4">
              <FormField
                control={addTransactionForm.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restock">Restock</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="removal">Removal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addTransactionForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      For restock: add to inventory. For removal: remove from inventory.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addTransactionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction notes" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={addTransactionMutation.isPending}>
                  {addTransactionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}