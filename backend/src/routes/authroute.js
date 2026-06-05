import {Router} from 'express'
import {registerUser,loginUser} from '../controllers/authcontroller'
const router = Router();
router.post('/auth/login',registerUser);
router.post('/auth/register',loginUser)

export default router