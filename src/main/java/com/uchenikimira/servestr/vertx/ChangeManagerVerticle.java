package com.uchenikimira.servestr.vertx;

/**
 * Created by ignikot on 31.01.2015.
 */

import io.vertx.core.AsyncResult;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.impl.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;

public class ChangeManagerVerticle extends AbstractVerticle {
    private static final Logger logger = LoggerFactory.getLogger(ChangeManagerVerticle.class);
    static final String PERSISTOR = "mongopersistor";
    static final String NEWS = "servestr.news";
    public void start() {
        JsonObject config = config().getJsonObject(PERSISTOR);
        logger.info(config().encodePrettily());
        logger.info(config.encodePrettily());
        MongoClient client = MongoClient.createShared(vertx, config, PERSISTOR);
        final EventBus eb = vertx.eventBus();
        vertx.eventBus().consumer("servestr.changemanager", (Message<JsonObject> clientMessage) -> {
            JsonObject body = clientMessage.body();
            String action = body.getString("action");
            String collection = body.getString("collection");
            if ("insert".equalsIgnoreCase(action)) {
                client.insert(collection, body.getJsonObject("document"), res -> {
                    if (res.succeeded()) {
                        String _id = res.result();
                        System.out.println(_id);
                        JsonObject newDocument = body.getJsonObject("document");
                        newDocument.put("_id", _id);
                        clientMessage.reply(newDocument);
                        eb.publish(NEWS, newDocument);
                    } else {
                        res.cause().printStackTrace();
                        clientMessage.fail(500, res.cause().getMessage());
                    }
                });
            } else if ("save".equalsIgnoreCase(action)) {
                logger.info("Update : " + body.toString());
                client.save(collection, body.getJsonObject("document"), res -> {
                    //clientMessage.fail(500, "Test");
                    //if(true) return;
                    if (res.succeeded()) {
                        JsonObject newDocument = body.getJsonObject("document");
                        clientMessage.reply(newDocument);
                        eb.publish(NEWS, body);
                    } else {
                        res.cause().printStackTrace();
                        clientMessage.fail(500, res.cause().getMessage());
                    }
                });
            } else if ("delete".equalsIgnoreCase(action)) {
                client.remove(collection, body.getJsonObject("query"), res -> {
                    if (res.succeeded()) {
                        JsonObject newDocument = body.getJsonObject("document");
                        clientMessage.reply(newDocument);
                        eb.publish(NEWS, body);
                    } else {
                        res.cause().printStackTrace();
                        clientMessage.fail(500, res.cause().getMessage());
                    }
                });
            } else if ("find".equalsIgnoreCase(action)) {
                JsonObject query = new JsonObject();
                client.find(collection, query, res -> {
                    if (res.succeeded()) {
                        clientMessage.reply(new JsonArray(res.result()));
                    } else {
                        res.cause().printStackTrace();
                        clientMessage.fail(500, res.cause().getMessage());
                    }
                });
            }
        });
        logger.info("ChangeManagerVerticle started");
    }
}
