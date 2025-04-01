import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertInventoryItemSchema, insertInventoryTransactionSchema, insertServiceRequestItemSchema } from "@shared/schema";
import { z } from "zod";

export function setupInventoryRoutes(app: Express) {
  // Get all inventory items
  app.get("/api/inventory", async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  // Get low stock items
  app.get("/api/inventory/low-stock", async (req: Request, res: Response) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Get a specific inventory item
  app.get("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const item = await storage.getInventoryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error(`Error fetching inventory item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  // Create a new inventory item
  app.post("/api/inventory", async (req: Request, res: Response) => {
    try {
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid inventory item data", 
          errors: error.errors 
        });
      }
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  // Update an inventory item
  app.patch("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const item = await storage.getInventoryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      const updatedItem = await storage.updateInventoryItem(id, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error(`Error updating inventory item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Record a new inventory transaction (restock, use, adjustment, etc.)
  app.post("/api/inventory/transactions", async (req: Request, res: Response) => {
    try {
      const transactionData = insertInventoryTransactionSchema.parse(req.body);
      
      // Make sure the inventory item exists
      const item = await storage.getInventoryItem(transactionData.itemId);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      const transaction = await storage.createInventoryTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid inventory transaction data", 
          errors: error.errors 
        });
      }
      console.error("Error creating inventory transaction:", error);
      res.status(500).json({ message: "Failed to create inventory transaction" });
    }
  });

  // Get inventory transactions for a specific item
  app.get("/api/inventory/:id/transactions", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const transactions = await storage.getInventoryTransactionsByItemId(id);
      res.json(transactions);
    } catch (error) {
      console.error(`Error fetching transactions for item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch inventory transactions" });
    }
  });

  // Add an item to a service request
  app.post("/api/service-requests/:id/items", async (req: Request, res: Response) => {
    try {
      const serviceRequestId = parseInt(req.params.id);
      if (isNaN(serviceRequestId)) {
        return res.status(400).json({ message: "Invalid service request ID format" });
      }

      // Check if service request exists
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ message: "Service request not found" });
      }

      // Validate and add the service request item
      const itemData = {
        ...req.body,
        serviceRequestId
      };
      
      const validatedData = insertServiceRequestItemSchema.parse(itemData);
      const serviceRequestItem = await storage.addItemToServiceRequest(validatedData);
      
      res.status(201).json(serviceRequestItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid service request item data", 
          errors: error.errors 
        });
      }
      console.error(`Error adding item to service request ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to add item to service request" });
    }
  });

  // Get all items for a service request
  app.get("/api/service-requests/:id/items", async (req: Request, res: Response) => {
    try {
      const serviceRequestId = parseInt(req.params.id);
      if (isNaN(serviceRequestId)) {
        return res.status(400).json({ message: "Invalid service request ID format" });
      }

      const items = await storage.getServiceRequestItems(serviceRequestId);
      res.json(items);
    } catch (error) {
      console.error(`Error fetching items for service request ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch service request items" });
    }
  });

  // Remove an item from a service request
  app.delete("/api/service-request-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      await storage.removeItemFromServiceRequest(id);
      res.status(204).send();
    } catch (error) {
      console.error(`Error removing service request item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to remove item from service request" });
    }
  });
}