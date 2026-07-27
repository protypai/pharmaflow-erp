import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { productCreateSchema, productUpdateSchema } from '../validators/schemas';

const router = Router();

// Every data router requires authentication (also gives us req.user.companyId for tenant scoping).
router.use(protect);

router.get('/low-stock', productController.getLowStockProducts.bind(productController));
router.get('/', productController.listProducts.bind(productController));
router.post('/', validate(productCreateSchema), productController.createProduct.bind(productController));
router.get('/:id', productController.getProductById.bind(productController));
router.put('/:id', validate(productUpdateSchema), productController.updateProduct.bind(productController));
router.get('/:id/batches', productController.getBatchStockList.bind(productController));

export default router;
