import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

router.get('/low-stock', productController.getLowStockProducts.bind(productController));
router.get('/', productController.listProducts.bind(productController));
router.post('/', productController.createProduct.bind(productController));
router.get('/:id', productController.getProductById.bind(productController));
router.put('/:id', productController.updateProduct.bind(productController));
router.get('/:id/batches', productController.getBatchStockList.bind(productController));

export default router;
