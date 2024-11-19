import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import db from '../database/connection';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import bcrypt from 'bcryptjs';
import { jwtVerify, signToken } from '../utils/tokens';
import validator from 'validator';
import { AuthErrorCode } from '../type/authErrors'

const login = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;

        // 1) Validation des données
        if (!email || !password) {
            return next(
                new AppError(
                    'Please provide email and password!',
                    AuthErrorCode.BAD_REQUEST
                )
            );
        }

        // 2) Vérification utilisateur et mot de passe
        const user: User | undefined = await db('users').where({ email }).first();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return next(
                new AppError(
                    'Incorrect email or password',
                    AuthErrorCode.UNAUTHORIZED
                )
            );
        }

        // 3) Vérification statut utilisateur
        if (!user.active) {
            return next(
                new AppError(
                    'This account is not active! Please contact support.',
                    AuthErrorCode.FORBIDDEN
                )
            );
        }

        // 4) Vérification reset password
        if (user.must_reset_password) {
            return res.status(200).json({
                status: 'success',
                message: 'User must reset password',
                user: {
                    id: user.id,
                    email: user.email,
                    must_reset_password: user.must_reset_password,
                },
            });
        }

        // 5) Création du token et envoi réponse
        const loggedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            department: user.department,
            must_reset_password: user.must_reset_password,
            created_at: user.created_at,
            authenticated: true,
        };

        const token = signToken(user.id, user.email);
        const cookieExpires = new Date(
            Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
        );

        // Vérifier si le token expire bientôt
        if (Date.now() + 5 * 60 * 1000 > cookieExpires.getTime()) {
            res.setHeader('X-Auth-Warning', 'Token will expire soon');
            res.status(AuthErrorCode.LOGIN_TIMEOUT);
        }

        res.cookie('jwt', token, {
            httpOnly: true,
            expires: cookieExpires,
            secure: process.env.NODE_ENV === 'production',
        });

        res.status(200).json({
            status: 'success',
            token,
            user: loggedUser,
        });
    }
);

const protect = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        let token;

        // 1) Vérification présence token
        if (req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(
                new AppError(
                    'You are not logged in!',
                    AuthErrorCode.UNAUTHORIZED
                )
            );
        }

        // 2) Vérification validité token
        try {
            const decoded = await jwtVerify(token, process.env.JWT_SECRET!);

            // Vérifier expiration imminente
            if (decoded.exp) {
                const timeUntilExpiry = decoded.exp * 1000 - Date.now();
                const fiveMinutes = 5 * 60 * 1000;

                if (timeUntilExpiry <= 0) {
                    return next(
                        new AppError(
                            'Your session has expired',
                            AuthErrorCode.SESSION_EXPIRED
                        )
                    );
                }

                if (timeUntilExpiry <= fiveMinutes) {
                    res.setHeader('X-Auth-Warning', 'Token will expire soon');
                    res.status(AuthErrorCode.LOGIN_TIMEOUT);
                }
            }

            // 3) Vérification existence utilisateur
            const currentUser = await db('users').where({ id: decoded.id }).first();
            if (!currentUser) {
                return next(
                    new AppError(
                        'User no longer exists',
                        AuthErrorCode.UNAUTHORIZED
                    )
                );
            }

            // 4) Vérification statut utilisateur
            if (!currentUser.active) {
                return next(
                    new AppError(
                        'This account has been deactivated',
                        AuthErrorCode.FORBIDDEN
                    )
                );
            }

            // 5) Vérification mise à jour utilisateur
            if (currentUser.updated_at.getTime() > decoded.iat * 1000 + 10000) {
                return next(
                    new AppError(
                        'User account has been updated. Please log in again',
                        AuthErrorCode.SESSION_EXPIRED
                    )
                );
            }

            currentUser.authenticated = true;
            req.user = currentUser;
            next();
        } catch (err) {
            return next(
                new AppError(
                    'Invalid token',
                    AuthErrorCode.UNAUTHORIZED
                )
            );
        }
    }
);

const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // if (!roles.includes(req.user?.role!)) {
    //   return next(
    //     new AppError('You do not have permission to perform this action', 403),
    //   );
    // }
    next();
  };
};

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('idi');

    // Clear the JWT cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000), // 10 seconds
      httpOnly: true,
    });

    res.status(200).json({ status: 'success' });
  },
);

const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, newPassword } = req.body;
    const id = userId;
    console.log(newPassword, id);

    // Valider le nouveau mot de passe
    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return next(
        new AppError(
          "Le mot de passe n'est pas assez fort. Il doit contenir au moins 8 caractères, dont une minuscule, une majuscule, un chiffre et un symbole.",
          400,
        ),
      );
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe dans la base de données
    await db('users').where({ id }).update({
      password: hashedPassword,
      must_reset_password: false, // Réinitialiser le flag must_reset_password
    });

    // Récupérer les informations mises à jour de l'utilisateur
    const updatedUser = await db('users')
      .where({ id })
      .first(
        'id',
        'username',
        'email',
        'phone',
        'department',
        'localisation',
        'profile',
        'created_at',
      );

    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }

    // Générer un nouveau token JWT
    const token = signToken(updatedUser.id, updatedUser.email);

    // Définir le nouveau cookie JWT
    res.cookie('jwt', token, {
      httpOnly: true,
      expires: new Date(
        Date.now() +
          Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
      ),
      secure: process.env.NODE_ENV === 'production',
    });

    // Renvoyer les informations complètes de l'utilisateur
    res.status(200).json({
      status: 'succès',
      message: 'Mot de passe mis à jour.',
      user: updatedUser,
    });
  },
);

const verifyToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get the token from the cookie
    const token = req.cookies.jwt;

    if (!token) {
      return next(new AppError('No token found', 401));
    }

    // 2) Verify the token
    const decoded = await jwtVerify(token, process.env.JWT_SECRET!);

    // 3) Check if user still exists
    const currentUser = await db('users').where({ id: decoded.id }).first();

    if (!currentUser) {
      return next(new AppError('User no longer exists', 401));
    }

    // 4) Check if user is still active
    if (!currentUser.active) {
      return next(new AppError('User account is not active', 401));
    }

    // 5) If everything ok, send user data
    const userData = {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      phone: currentUser.phone,
      department: currentUser.department,
      created_at: currentUser.created_at,
    };

    res.status(200).json({
      status: 'success',
      user: userData,
    });
  },
);

const getCurrentUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return next(
                new AppError(
                    'User not found',
                    AuthErrorCode.NOT_FOUND
                )
            );
        }

        // Vérifier si le token dans le cookie va expirer bientôt
        const token = req.cookies.jwt;
        if (token) {
            try {
                const decoded = await jwtVerify(token, process.env.JWT_SECRET!);
                if (decoded.exp) {
                    const timeUntilExpiry = decoded.exp * 1000 - Date.now();
                    const fiveMinutes = 5 * 60 * 1000;

                    if (timeUntilExpiry <= 0) {
                        return next(
                            new AppError(
                                'Your session has expired',
                                AuthErrorCode.SESSION_EXPIRED
                            )
                        );
                    }

                    if (timeUntilExpiry <= fiveMinutes) {
                        res.setHeader('X-Auth-Warning', 'Token will expire soon');
                        res.status(AuthErrorCode.LOGIN_TIMEOUT);
                    }
                }
            } catch (err) {
                return next(
                    new AppError(
                        'Invalid token',
                        AuthErrorCode.UNAUTHORIZED
                    )
                );
            }
        }

        const loggedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            department: user.department,
            must_reset_password: user.must_reset_password,
            created_at: user.created_at,
            authenticated: true,
        };

        res.status(200).json({
            status: 'success',
            user: loggedUser
        });
    }
);


export default {
  login,
  protect,
  restrictTo,
  logout,
  changePassword,
  verifyToken,
  getCurrentUser,
};
