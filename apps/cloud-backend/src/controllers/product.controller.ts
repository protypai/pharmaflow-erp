import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { productService } from '../services/product.service';

export class ProductController {
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user!.companyId;
    const product = await productService.createProduct(companyId, req.body);
    sendSuccess(res, product, 'Product created', 201);
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user!.companyId;
    const product = await productService.updateProduct(companyId, req.params.id, req.body);
    sendSuccess(res, product, 'Product updated');
  });

  listProducts = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user!.companyId;
    const params = {
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      manufacturerId: req.query.manufacturerId as string,
    };
    const result = await productService.listProducts(companyId, params);
    sendSuccess(res, result, 'Products fetched');
  });

  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user!.companyId;
    const product = await productService.getProductById(companyId, req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    sendSuccess(res, product, 'Product details');
  });

  getBatchStockList = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user!.companyId;
    const batches = await productService.getBatchStockList(companyId, req.params.id);
    sendSuccess(res, batches, 'Batches fetched');
  });

  getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.user!.companyId;
    const products = await productService.getLowStockProducts(companyId);
    sendSuccess(res, products, 'Low stock products fetched');
  });
}

export const productController = new ProductController();
