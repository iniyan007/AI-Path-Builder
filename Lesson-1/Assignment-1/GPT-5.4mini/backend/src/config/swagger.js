import swaggerJSDoc from "swagger-jsdoc";

export function createSwaggerSpec() {
  return swaggerJSDoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Enterprise MERN Todo API",
        version: "1.0.0"
      },
      servers: [{ url: "/api" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    },
    apis: []
  });
}
