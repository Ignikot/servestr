package com.uchenikimira.servestr.vertx;

/**
 * Created by ignikot on 31.01.2015.
 */

import io.vertx.core.*;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.impl.LoggerFactory;

public class MainVerticle extends AbstractVerticle {
    private static final Logger logger = LoggerFactory.getLogger(MainVerticle.class);
    public void start() {
        DeploymentOptions options = new DeploymentOptions().setConfig(config());
        vertx.deployVerticle("com.uchenikimira.servestr.vertx.ChangeManagerVerticle", options);
        logger.info("ChangeManagerVerticle started");
        vertx.deployVerticle("com.uchenikimira.servestr.vertx.HttpServerVerticle", options);
        logger.info("HttpServerVerticle started");
        logger.info("MainVerticle started");
        /*
        DeploymentOptions authOptions = new DeploymentOptions().setConfig(config().getJsonObject("auth"));
        vertx.deployVerticle("service:io.vertx.shiro-auth-service", authOptions, authRes -> {
            if(authRes.succeeded()) {
                logger.info("AuthProviderImpl started");
                DeploymentOptions options = new DeploymentOptions().setConfig(config());
                vertx.deployVerticle("com.uchenikimira.servestr.vertx.ChangeManagerVerticle", options);
                logger.info("ChangeManagerVerticle started");
                vertx.deployVerticle("com.uchenikimira.servestr.vertx.HttpServerVerticle", options);
                logger.info("HttpServerVerticle started");
                logger.info("MainVerticle started");
            } else {
                authRes.cause().printStackTrace();
            };
        });
        */
    }
}
