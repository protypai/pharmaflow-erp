import { Request, Response } from 'express';
import { productService } from '../services/product.service';

export class ProductController {
  async createProduct(req: Request, res: Response) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async listProducts(req: Request, res: Response) {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        manufacturerId: req.query.manufacturerId as string
      };
      const result = await productService.listProducts(params);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBatchStockList(req: Request, res: Response) {
    try {
      const batches = await productService.getBatchStockList(req.params.id);
      res.json(batches);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getLowStockProducts(req: Request, res: Response) {
    try {
      const products = await productService.getLowStockProducts();
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const productController = new ProductController();
