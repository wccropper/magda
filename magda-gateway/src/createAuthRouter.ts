import { Router } from "express";
import fetch from "isomorphic-fetch";
import ApiClient from "magda-typescript-common/src/authorization-api/ApiClient";
import addTrailingSlash from "magda-typescript-common/src/addTrailingSlash";
import Authenticator from "./Authenticator";
import createAuthPluginRouter, {
    AuthPluginBasicConfig,
    AuthPluginConfig
} from "./createAuthPluginRouter";
import passport from "passport";
import pg from "pg";

export interface AuthRouterOptions {
    dbPool: pg.Pool;
    authenticator: Authenticator;
    jwtSecret: string;
    facebookClientId: string;
    facebookClientSecret: string;
    googleClientId: string;
    googleClientSecret: string;
    aafClientUri: string;
    aafClientSecret: string;
    arcgisClientId: string;
    arcgisClientSecret: string;
    arcgisInstanceBaseUrl: string;
    esriOrgGroup: string;
    ckanUrl: string;
    authorizationApi: string;
    externalUrl: string;
    userId: string;
    vanguardWsFedIdpUrl: string;
    vanguardWsFedRealm: string;
    vanguardWsFedCertificate: string;
    enableInternalAuthProvider: boolean;
    plugins: AuthPluginBasicConfig[];
}

export default function createAuthRouter(options: AuthRouterOptions): Router {
    const authRouter: Router = Router();
    const authApi = new ApiClient(
        options.authorizationApi,
        options.jwtSecret,
        options.userId
    );

    // Auth Plugin routes will be add to this router as they are expected to manage session by themselves
    // this outer is added to authRouter fiest to ensure no unnecessary middlewares are run
    const sessionRouter: Router = Router();
    // authenticator routes are always added to `sessionRouter`
    options.authenticator.applyToRoute(sessionRouter);

    const providers = [
        {
            id: "internal",
            enabled: options.enableInternalAuthProvider ? true : false,
            authRouter: options.enableInternalAuthProvider
                ? require("./oauth2/internal").default({
                      passport: passport,
                      dbPool: options.dbPool,
                      externalAuthHome: `${options.externalUrl}/auth`
                  })
                : null
        },
        {
            id: "facebook",
            enabled: options.facebookClientId ? true : false,
            authRouter: options.facebookClientId
                ? require("./oauth2/facebook").default({
                      authorizationApi: authApi,
                      passport: passport,
                      clientId: options.facebookClientId,
                      clientSecret: options.facebookClientSecret,
                      externalAuthHome: `${options.externalUrl}/auth`
                  })
                : null
        },
        {
            id: "google",
            enabled: options.googleClientId ? true : false,
            authRouter: options.googleClientId
                ? require("./oauth2/google").default({
                      authorizationApi: authApi,
                      passport: passport,
                      clientId: options.googleClientId,
                      clientSecret: options.googleClientSecret,
                      externalAuthHome: `${options.externalUrl}/auth`
                  })
                : null
        },
        {
            id: "arcgis",
            enabled: options.arcgisClientId ? true : false,
            authRouter: options.arcgisClientId
                ? require("./oauth2/arcgis").default({
                      authorizationApi: authApi,
                      passport: passport,
                      clientId: options.arcgisClientId,
                      clientSecret: options.arcgisClientSecret,
                      arcgisInstanceBaseUrl: options.arcgisInstanceBaseUrl,
                      externalAuthHome: `${options.externalUrl}/auth`,
                      esriOrgGroup: options.esriOrgGroup
                  })
                : null
        },
        {
            id: "ckan",
            enabled: options.ckanUrl ? true : false,
            authRouter: options.ckanUrl
                ? require("./oauth2/ckan").default({
                      authorizationApi: authApi,
                      passport: passport,
                      externalAuthHome: `${options.externalUrl}/auth`,
                      ckanUrl: options.ckanUrl
                  })
                : null
        },
        {
            id: "aaf",
            enabled: options.aafClientUri ? true : false,
            authRouter: options.aafClientUri
                ? require("./oauth2/aaf").default({
                      authorizationApi: authApi,
                      passport: passport,
                      aafClientUri: options.aafClientUri,
                      aafClientSecret: options.aafClientSecret,
                      externalUrl: options.externalUrl
                  })
                : null
        },
        {
            id: "vanguard",
            enabled: options.vanguardWsFedIdpUrl ? true : false,
            authRouter: options.vanguardWsFedIdpUrl
                ? require("./oauth2/vanguard").default({
                      authorizationApi: authApi,
                      passport: passport,
                      wsFedIdpUrl: options.vanguardWsFedIdpUrl,
                      wsFedRealm: options.vanguardWsFedRealm,
                      wsFedCertificate: options.vanguardWsFedCertificate,
                      externalUrl: options.externalUrl
                  })
                : null
        }
    ];

    // Define routes.
    authRouter.get("/", sessionRouter, function (req, res) {
        res.render("home", { user: req.user });
    });

    authRouter.get("/login", sessionRouter, function (req, res) {
        res.render("login");
    });

    authRouter.get("/admin", sessionRouter, function (req, res) {
        res.render("admin");
    });

    /**
     * @apiGroup Authentication API
     * @api {get} /auth/plugins Get the list of available authentication plugins
     * @apiDescription Returns all installed authentication plugins. This endpoint is only available when gateway `enableAuthEndpoint`=true
     *
     * @apiSuccessExample {json} 200
     *    [{
     *        "key":"google",
     *        "name":"Google",
     *        "iconUrl":"http://xxx/sds/sds.jpg",
     *        "authenticationMethod": "IDP-URI-REDIRECTION"
     *    }]
     *
     */
    authRouter.get("/plugins", async (req, res) => {
        if (!options?.plugins?.length) {
            res.json([]);
            return;
        }

        const data = await Promise.all(
            options.plugins.map(async (plugin) => {
                const res = await fetch(
                    addTrailingSlash(plugin.baseUrl) + "config"
                );
                const data = (await res.json()) as AuthPluginConfig;
                return {
                    ...data,
                    key: plugin.key
                };
            })
        );

        res.json(data);
    });

    // setup auth plugin routes
    if (options?.plugins?.length) {
        authRouter.use(
            "/login/plugin",
            createAuthPluginRouter({
                plugins: options.plugins,
                cookieOptions: options.authenticator.sessionCookieOptions
            })
        );
    }

    providers
        .filter((provider) => provider.enabled)
        .forEach((provider) => {
            authRouter.use("/login/" + provider.id, [
                // actually, body-parser is only required by localStrategy (i.e. `internal` & ckan provider)
                // since we are moving all auth providers to external auth plugins soon, we add bodyParser to all providers routes as before
                require("body-parser").urlencoded({ extended: true }),
                sessionRouter,
                provider.authRouter
            ]);
        });

    /**
     * @apiGroup Authentication API
     * @api {get} /auth/providers Get the list of available authentication providers
     * @apiDescription Returns all installed authentication providers.
     *  This endpoint is only available when gateway `enableAuthEndpoint`=true.
     *  Please note: We are gradually replacing non-plugable authenticaiton providers with [authentication plugins](https://github.com/magda-io/magda/tree/master/deploy/helm/internal-charts/gateway#authentication-plugin-config)
     *
     * @apiSuccessExample {string} 200
     *    ["internal","facebook","google","arcgis","ckan","vanguard"]
     *
     */
    authRouter.get("/providers", (req, res) => {
        res.json(
            providers
                .filter((provider) => provider.enabled)
                .map((provider) => provider.id)
        );
    });

    authRouter.get(
        "/profile",
        sessionRouter,
        require("connect-ensure-login").ensureLoggedIn(),
        function (req, res) {
            authApi
                .getUser(req.user.id)
                .then((user) =>
                    res.render("profile", { user: user.valueOrThrow() })
                )
                .catch((error: Error) => {
                    console.error(error);
                    res.status(500).send("Error");
                });
        }
    );

    // --- /auth/logout route is now handled by Authenticator.ts

    return authRouter;
}
