package com.uchenikimira.servestr.vertx;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.*;
import io.vertx.ext.web.handler.sockjs.BridgeEvent;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;
import io.vertx.ext.web.sstore.LocalSessionStore;
import io.vertx.ext.auth.AuthProvider;
import io.vertx.ext.auth.shiro.ShiroAuth;
import io.vertx.ext.auth.shiro.ShiroAuthRealmType;

import java.util.HashSet;
import java.util.Set;

/**
 * Created by ignikot on 01.02.2015.
 */
public class HttpServerVerticle extends AbstractVerticle {
    private static final Logger logger = LoggerFactory.getLogger(HttpServerVerticle.class);
    public void start() {

        String port = System.getProperty("http.port");
        if (port == null || port.isEmpty()) {
            port = System.getenv("PORT");
            if (port == null || port.isEmpty()) {
                port = "8080";
            };
        };
        String address = System.getProperty("http.address");

        JsonObject config = config().getJsonObject("auth");

        AuthProvider authProvider = ShiroAuth.create(vertx, ShiroAuthRealmType.PROPERTIES, config);
        Router router = Router.router(vertx);
        CorsHandler corsh = CorsHandler.create("*");
        corsh.allowedMethod(HttpMethod.CONNECT);
        corsh.allowedMethod(HttpMethod.DELETE);
        corsh.allowedMethod(HttpMethod.GET);
        corsh.allowedMethod(HttpMethod.HEAD);
        corsh.allowedMethod(HttpMethod.OPTIONS);
        corsh.allowedMethod(HttpMethod.PATCH);
        corsh.allowedMethod(HttpMethod.POST);
        corsh.allowedMethod(HttpMethod.PUT);
        corsh.allowedMethod(HttpMethod.TRACE);
        router.route().handler(corsh);
        router.route().handler(CookieHandler.create());
        router.route().handler(SessionHandler.create(LocalSessionStore.create(vertx)));

        AuthHandler basicAuthHandler = BasicAuthHandler.create(authProvider);

        // All requests to paths starting with '/private/' will be protected
        router.route("/components/*").handler(basicAuthHandler);

        PermittedOptions outboundPermitted = new PermittedOptions().setAddress("servestr.news");

        PermittedOptions inboundPermittedFind = new PermittedOptions().setAddress("servestr.changemanager");
        JsonObject matchFind = new JsonObject();
        matchFind.put("action", "find");
        inboundPermittedFind.setMatch(matchFind);
        //inboundPermittedFind.setRequiredAuthority("read");

        PermittedOptions inboundPermittedInsert = new PermittedOptions().setAddress("servestr.changemanager");
        JsonObject matchInsert = new JsonObject();
        matchInsert.put("action", "insert");
        inboundPermittedInsert.setMatch(matchInsert);
        //inboundPermittedInsert.setRequiredAuthority("write");


        PermittedOptions inboundPermittedSave = new PermittedOptions().setAddress("servestr.changemanager");
        JsonObject matchSave = new JsonObject();
        matchSave.put("action", "save");
        inboundPermittedSave.setMatch(matchSave);
        //inboundPermittedSave.setRequiredAuthority("write");

        PermittedOptions inboundPermittedDelete = new PermittedOptions().setAddress("servestr.changemanager");
        JsonObject matchDelete = new JsonObject();
        matchDelete.put("action", "delete");
        inboundPermittedDelete.setMatch(matchDelete);
        //inboundPermittedDelete.setRequiredAuthority("write");

        BridgeOptions options = new BridgeOptions()
                .addOutboundPermitted(outboundPermitted)
                .addInboundPermitted(inboundPermittedFind)
                .addInboundPermitted(inboundPermittedInsert)
                .addInboundPermitted(inboundPermittedSave)
                .addInboundPermitted(inboundPermittedDelete);

        router.route("/eventbus/*").handler(SockJSHandler.create(vertx).bridge(options));

        router.route()
                .handler(StaticHandler.create())
                //.handler(LoggerHandler.create())
                .failureHandler(ErrorHandler.create());
        if (address == null || address.isEmpty()) {
            vertx.createHttpServer().requestHandler(router::accept).listen(Integer.parseInt(port));
        } else {
            vertx.createHttpServer().requestHandler(router::accept).listen(Integer.parseInt(port), address);
        }


        logger.info("HttpServerVerticle started");
    }

}
