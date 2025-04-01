# KazeJS

A flexible Node.js web framework built with TypeScript, focusing on dependency injection, routing, and middleware management. This package allows easy integration of external dependencies, such as a database, into your application. It supports dynamic route groups, global middleware, schema validation with error handling, and static file serving. With customizable error handlers for general and validation errors, it ensures a smooth development experience for building scalable web applications with type safety and clean architecture.

![KazeJS](https://raw.githubusercontent.com/ks961/imgs/refs/heads/main/KazeJS.png)

- **Features**
    - [**Class Based Routing and Controller Setup**](#1-class-based-routing-and-controller-setup)
    - [**Routing [ static | dynamic ]**](#2-routing--static--dynamic-)
    - [**Route Grouping [ static | dynamic ]**](#3-route-grouping--static--dynamic-)
    - [**Middleware support**](#4-middleware-support)
    - [**Dependency injection (Optional)**](#5-dependency-injection)
    - [**Schema validation [ query | params | json-body ]**](#6-schema-validation--query--params--json-body-)
    - [**Static file serving**](#7-static-file-serving)
    - [**Global middleware support**](#8-global-middleware-support)
    - [**Global error handling support [ Handler Errors | Schema validation Errors ]**](#9-global-error-handling-support--handler-errors--schema-validation-errors-)
    - [**Async Request Handling**](#10-async-request-handling)
    - [**Jwt Support**](#11-jwt-support)
    - [**Cors Handling**](#12-cors-handling)
    - [**File Upload**](#13-file-upload)
    - [**Rendering Engine**](#14-rendering-engine)
    - [**FileRouting [ Static | Dynamic | Middleware ]**](#15-filerouting--static--dynamic--middleware-)

---

### 1. Class Based Routing and Controller Setup:

#### 0. **Before using this pattern**
1. You must be using Typescript.
2. Your tsconfig.json file must have these two options set to true.
```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
    }
}
```

#### 1. **@ParentRoute [Class Decorator]**

The `@ParentRoute` decorator is used to define a parent route or namespace for all routes in a controller class. It acts like `app.use("/parent", router)` in Express, prefixing all routes inside the class with the given path.

**Example**:
```typescript
@ParentRoute("/users")
export class UsersController {
    // All routes inside this class will be prefixed with "/users"
    // All method declared inside must be 'static'
}
```

**Explanation**:
- The `@ParentRoute("/users")` decorator will make all the routes inside the `UsersController` class available under `/users` (e.g., `/users/:id`).
- This decorator can only be applied at the class level and cannot be used on individual methods.

---

#### 2. **@ErrorHandler [Method Decorator]**

The `@ErrorHandler` decorator is used to define a custom error handler for a route or controller method. It catches any errors thrown within the route handler and allows you to customize the error response.

**Function Type**: 
```typescript
type ErrorHandler = (ctx: KazeContext, next: KazeNextFunction) => void;
```

**Example**:
```typescript
@ErrorHandler(errorHandler) // it will also act as a fallback if some method throws any kind of errors and you didn't declare '@ErrorHandler' over that method, then this will catch it.
export class UsersController {
    @Get("/:id")
    @ErrorHandler(errorHandler) // this can be specific to methods too.
    static getUser(ctx: KazeContext) {
        // Custom error handler will catch any errors thrown here
    }
}
```

**Explanation**:
- The `@ErrorHandler(errorHandler)` decorator specifies the error handler for the `getUser` route method.
- If an error is thrown within this method, the specified `errorHandler` function will handle the error.
- **Type of `errorHandler` function**:
  - `ctx`: The context object representing the request/response cycle.
  - `next`: A function that can be called to pass control to the next middleware or error handler.

---

#### 3. **@VErrorHandler [Method Decorator]**

The `@VErrorHandler` decorator is used to define a validation error handler for a route or controller method. It specifically handles errors related to validation issues and provides a mechanism to customize the validation error response.

**Function Type**: 
```typescript
type VErrorHandler = (ctx: KazeContext, error: KazeValidationError) => void;
```

**Example**:
```typescript
@VErrorHandler(errorVHandler) // it will also act as a fallback if some method throws validation error and you didn't declare '@VErrorHandler' over that method, then this will catch it.
export class UsersController {
    @Get("/:id")
    @VErrorHandler(errorVHandler2) // this can be specific to methods too.
    static getUser(ctx: KazeContext) {
        // Custom validation error handler will catch any validation errors thrown here
    }
}
```

**Explanation**:
- The `@VErrorHandler(errorVHandler)` decorator specifies a validation error handler for the `getUser` method.
- If a validation error occurs in this method (such as failed input validation), the `errorVHandler` function will be called.
- **Type of `errorVHandler` function**:
  - `ctx`: The context object representing the request/response cycle.
  - `error`: The validation error that occurred during input validation.

---

#### 4. **@Middlewares [Method Decorator]**

The `@Middlewares` decorator is used to specify one or more middleware functions for a route or controller method. These middleware functions will be executed before the actual route handler is called.

**Function Type**: 
```typescript
type Middleware = (ctx: KazeContext, next: KazeNextFunction) => void;
```

**Example**:
```typescript
@Middlewares(middleware1) // this will run for all method before they execute.
export class UsersController {
    @Get("/:id")
    @Middlewares(middleware2) // middleware can be specific to methods too.
    static getUser(ctx: KazeContext) {
        // The middlewares will run before this method is executed
    }
}
```

**Explanation**:
- The `@Middlewares(middleware1)` decorator applies the specified middlewares to the `getUser` route.
- The middlewares will run in the order they are specified, and then the route handler will execute.
- **Type of `middleware` function**:
  - `ctx`: The context object representing the request/response cycle.
  - `next`: A function that must be called to pass control to the next middleware or route handler.

---

#### 5. **Route Method Decorators (@Get, @Post, etc.) [Method Decorator]**

To define routes for HTTP methods like GET, POST, PUT, DELETE, etc., you can use the respective decorators such as `@Get`, `@Post`, `@Put`, and `@Delete`. These decorators map HTTP methods to specific methods in the controller class.

**Example**:
```typescript
@Get("/:id")
static getUser(ctx: KazeContext) {
    ctx.res.send("User details");
}
```

**Explanation**:
- The `@Get("/:id")` decorator binds the `getUser` method to handle GET requests at the `/users/:id` route.
- Similarly, you can use `@Post`, `@Put`, and `@Delete` for other HTTP methods.

---

#### 6. **Static Methods in Controller [Method Requirement]**

All methods in the controller class should be static. This is necessary because the routes and their handlers are registered statically.

**Example**:
```typescript
export class UsersController {
    @Get("/:id")
    static getUser(ctx: KazeContext) {
        ctx.res.send("User details");
    }
}
```

**Explanation**:
- The `getUser` method is declared as `static`, which is a requirement for controller methods. It ensures that the route handler is properly registered when the controller is instantiated.

---

#### 7. **app.controller() [Controller Registration]**

After defining the controller with routes, you need to register it using `app.controller()`.

**Example**:
```typescript
const app = new Kaze({
    class: true // class must set to true, if you wanna use class based controllers.
});

app.controller(UsersController);

app.listen(3000);
```

**Explanation**:
- This registers the `UsersController` class with the application, making all its routes available for handling HTTP requests.

---

### 2. **Routing [ Static | Dynamic ]**

#### This is an entirely different pattern in which this web framework can be used. It functions similarly to how an Express-like framework operates.
**Static Route Example**:  
```typescript
const app = new Kaze();

app.get("/api/users", async (ctx: KazeContext<Dep>) => {
    // Fetch and return a list of users
    const users = await ctx.dependencies?.db.query("SELECT * FROM users");
    ctx.res.json({ message: "List of users", users });
});

app.listen(3000);
```

**Dynamic Route Example**:
```typescript
app.get("/api/users/:id", async (ctx: KazeContext<Dep, { id: string }>) => {
    const userId = ctx.req.params?.id;
    // Fetch and return user by ID
    const user = await ctx.dependencies?.db.query(`SELECT * FROM users WHERE id=${userId}`);
    ctx.res.json({ user });
});
```

---

### 3. **Route Grouping [ Static | Dynamic ]**

**Route Group Example**:  
```typescript
const userRouter = Kaze.Router();

// Grouped route - static
userRouter.get("/profile", (ctx: KazeContext<Dep>) => {
    ctx.res.json({ message: "User profile" });
});

// Grouped route - dynamic
userRouter.get("/:id", (ctx: KazeContext<Dep, { id: string }>) => {
    const userId = ctx.req.params?.id;
    ctx.res.json({ userId, message: "User details" });
});

// Apply route group to main app
app.routeGrp("/users", userRouter);
```

---

### 4. **Middleware Support**

**Middleware Example**:  
```typescript
function authMiddleware(ctx: KazeContext, next: KazeNextFunction) {
    // Simulate authentication check
    console.log("Authentication check...");
    next();
}

app.get("/api/protected", authMiddleware, (ctx: KazeContext<Dep>) => {
    ctx.res.json({ message: "Access granted" });
});
```

---

### 5. **Dependency Injection**

**Dependency Injection Example**:  
```typescript
class UserService {
    async findUserById(id: string) {
        // Simulate fetching user from DB
        console.log(`Fetching user with ID: ${id}`);
        return { id, name: "John Doe" };
    }
}

const dependencies = {
    userService: new UserService(),
};

const app = new Kaze({
    dependencies,
});

app.get("/api/users/:id", async (ctx: KazeContext<typeof dependencies, { id: string }>) => {
    const userId = ctx.req.params?.id;
    const user = await ctx.dependencies?.userService.findUserById(userId);
    ctx.res.json(user);
});
```

---

### 6. **Schema Validation [ Query | Params | JSON Body ]**

**Query Validation Example**:
```typescript
const ageSchema = Validator.object({
    // .parse() will handle the 'string' data and handle it as number dtype
    age: Validator.number()
        .greaterThanOrEqual(18, "Age must be greater than 18.")
        .parse()
});

app.get("/api/validate", queryValidate(ageSchema), (ctx: KazeContext<any, { age: number }>) => {
    const age = ctx.req.query?.age;
    ctx.res.json({ message: `Age is valid: ${age}` });
});
```

**Params Validation Example**:
```typescript
const ageSchema = Validator.object({
    // .parse() will handle the 'string' data and handle it as number dtype
    age: Validator.number()
        .greaterThanOrEqual(18, "Age must be greater than 18.")
        .parse() 
});

app.get("/api/:age", paramsValidate(ageSchema), (ctx: KazeContext<any, any, { age: number }>) => {
    const age = ctx.req.params?.age;
    ctx.res.json({ message: `Age is valid: ${age}` });
});
```

**JSON Body Validation Example**:
```typescript
const ageSchema = Validator.object({
    // .parse() will handle the 'string' data and handle it as number dtype
    age: Validator.number()
        .greaterThanOrEqual(18, "Age must be greater than 18.")
        .parse()
});

app.get("/api/user", jsonValidate(ageSchema), (ctx: KazeContext<any, any, any, { age: number }>) => {
    const age = ctx.req.body?.age;
    ctx.res.json({ message: `Age is valid: ${age}` });
});
```

---

### 7. **Static File Serving**

**Static File Example**:  
```typescript
// Serve files from the 'public' folder (like HTML, CSS, images)
app.static("public");
```

---

### 8. **Global Middleware Support**

**Global Middleware Example**:  
```typescript
app.addGlobalMiddleware([
    Kaze.parseCookies(), // Middleware to parse cookies
    Kaze.parseBody()   // Middleware to parse incoming JSON or urlencoded body
]);

// or add it one by one
app.addGlobalMiddleware(singleGlobalMiddleware);
app.addGlobalMiddleware(anotherGlobalMiddleware);
```

---

### 9. **Global Error Handling Support [ Handler Errors | Schema Validation Errors ]**

**Global Error Handler Example**:  
```typescript
app.globalErrorHandler((ctx: KazeContext, err: unknown) => {

    if(err instanceof YourCustomThrownError) {
        // handle it respectively
    } else {
        ctx.res.statusCode(500)
        ctx.res.send({ error: "Internal Server Error" });
    }
});

// Validation-specific error handling [ Invoked when a validation error occurs from 'queryValidate', 'paramsValidate' ]
app.globalVErrorHandler((ctx: KazeContext, err: KazeKazeValidationError) => {

    console.log(err.vErrors); // Schema keys with their error messages
    ctx.res.statusCode(400)
    ctx.res.json({ error: err.message });
});
```

---

### 10. **Async Request Handling**

**Async Request Example**:
```typescript
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.get("/api/delay", async (ctx: KazeContext) => {
    await sleep(2000); // Simulate a delay (e.g., long DB query)
    ctx.res.json({ message: "Response after delay" });
});

// Async Middlewares
async function anyMiddleware(ctx: KazeContext, next: KazeNextFunction) {
    await sleep(2000);
    
    next();
}

app.get("/middleware", anyMiddleware, async(ctx: KazeContext) => {
    ctx.res.send("works");
});
```

---

### 11. **Jwt Support**

**Jwt Example**:
```typescript

type CustomClaimType = {
    role: "admin" | "user"
}

app.get("/login", async (ctx: KazeContext) => {

     const jwt = await signJwt({
            aud: "http://localhost:4000",
            iat: createIssueAt(new Date()),
            exp: createExpiry("1h"),
            iss: "server-x",
            sub: "user"
        },
        { role: "admin" },
        "itsasecret", // secret key
        { alg: "HS512" } // optional
    );

    ctx.res.json({ token: jwt });

    // or send it via cookie
    
    ctx.res.setCookie("token", jwt, {
        path: "/",
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1hr from now
        httpOnly: true,
        sameSite: "Lax"
    })
});

// Auth Middlewares
async function auth(ctx: KazeContext, next: KazeNextFunction) {
    const token = ctx.req.cookies?.get("token");

    try {
        const verifiedPayload = await verifyJwt<CustomClaimType>(token,"itsasecret");
        next();
    } catch {
        ctx.res.send("Invalid token");
        // or you can throw a custom error and handle it in global-error handler
    }
}

app.get("/protected-route", auth, async(ctx: KazeContext) => {
    ctx.res.send("works");
});
```

#### Error Handling

The `verifyJwt` function may throw the following errors:

1. **DirtyJwtSignature**: If the JWT signature doesn't match or is invalid.
2. **ExpiredJwt**: If the token has expired (based on the `exp` claim).
3. **InvalidJwt**: If the token is malformed or cannot be decoded properly.

```typescript
async function auth(ctx: KazeContext, next: KazeNextFunction) {
    const jwt = "your.jwt.token";
    const secret = "itsasecret";

    try {
        const verifiedClaims = await verifyJwt(jwt, secret);
        console.log(verifiedClaims);
    } catch (error) {
        if (error instanceof DirtyJwtSignature) {
            console.error("Error: JWT signature is invalid or has been tampered with.");
        } else if (error instanceof ExpiredJwt) {
            console.error("Error: JWT has expired.");
        } else if (error instanceof InvalidJwt) {
            console.error("Error: JWT is malformed or cannot be decoded.");
        } else {
            console.error("Unexpected error:", error);
        }
    }
}
```

---

### 12. **CORS Handling**

**Cors Example**:
```typescript

app.addGlobalMiddleware(cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST"],
}));

app.get("/api/endpoint", (ctx: KazeContext) => {
    ctx.res.send("hello");
});
```

---

### 13. **File Upload**

**File upload Example**:
```typescript

app.addGlobalMiddleware([
    // It will also handle both normal input field and "single/multi" file upload
    // only for content-type: 'multipart/form-data'

    /**
     * FileUploadOptions = {
     *     limit?: FileSizeBytes ( number ),
     *     fileNameMutateFn?: FilenameMutateFn,
     *     acceptedMimeType?: ReturnType<typeof getMimeType>[] ( string[] ),
     * }
    */
    Kaze.fileUpload({
        limit: 100, // optional
    });
]);

app.post("/submit", (ctx: KazeContext) => {
    
    if(ctx.req.files && ctx.req.files?.length > 0) {
        console.log(ctx.req.files?.[0].fileName);
        console.log(ctx.req.files?.[0].fileSize);
    }

    console.log(ctx.req.body) // if there're normal input fields
    ctx.res.send("works");
});
```

---

### 14. **Rendering Engine**

Kaze custom rendering engines, enabling dynamic template rendering with data binding and template rendering flexibility. This feature allows for greater control over how the HTML is rendered in response to requests.

#### **Rendering Engine Integration**

To integrate and use the custom rendering engine with Kaze, you can define a rendering engine function and register it with the Kaze application.

**Example of Rendering Engine Definition**:
```typescript
// can be async engine [ if needed to read files inside ].
function yourEngine(rctx: KazeRendererContext, template: string, data?: Record<string, any>): HTMLSource | Promise<HTMLSource> { 
    // Replace placeholder text in the template
    template = template.replace("DocumentXYZ", "Engine Based").replace("not works", "works");

    // Iterate through the provided data and replace placeholders in the template
    for (const key in data) {
        template = template.replaceAll(`{{${key}}}`, data[key]); // will replace {{key}} with value in data[key]
    }
    return template;
}
```

In this example, the `engine` function takes a `KazeRendererContext`, the `template` string, and an optional `data` object. It replaces any placeholders in the template (such as `{{name}}`) with the provided data, allowing dynamic content rendering.

#### **Registering the Rendering Engine**

Once you have defined the rendering engine function, you can register it with Kaze to handle rendering requests:

```typescript
app.renderEngine(yourEngine, path.join(__dirname, "views"), {
    fileExtension: "eng"
});
```

This registers the custom rendering engine with Kaze and sets the directory path where the template files are located. It also specifies the file extension of the templates (e.g., `.html`).

#### **Rendering a Template**

To render a template, you can use the `ctx.res.render()` method inside your route handlers. The `render()` method allows you to specify a template name and the data to be injected into the template.

**Example of Rendering a Template**:
```typescript
app.get("/", (ctx: KazeContext) => {
    // Render the "index" template with dynamic data
    ctx.res.render("index", {
        name: "From KazeJs"
    });
});
```

In this example, the `index` template is rendered, and the placeholder `{{name}}` in the template is replaced with the string "From KazeJs".

#### **Kaze Renderer Context Types**

The `KazeRendererContext` provides information about the template being rendered and the rendering environment. It includes:

- `filepath`: The path to the current template file being rendered.
- `renderEngineDirPath`: The directory path of the rendering engine's templates.

---

Here's how you can add the new information about FileRouting to your README docs, following the same style as your previous entries:

---

### 15. **FileRouting [ Static | Dynamic | Middleware ]**

#### This is also completely different approach for using the web framework. It operates by creating files with specific names and following the patterns associated with those names.

**FileRouting Overview**:  
FileRouting allows you to define routes and middlewares by organizing them inside directories. The route and middleware behavior is determined by the structure of the directories and files.

**File Routing Convention**:  
- **Wildcard Route**:  
  A directory with the name starting with `@` is treated as a wildcard route, which must be a directory name.
  - Example: `@` or `@some-name`

- **Static Route**:  
  A directory with a simple name is treated as a static pathname route.
  - Example: `product`

- **Path Parameter Route**:  
  A directory name enclosed in square brackets `[]` is treated as a path parameter route.
  - Example: `[id]`

- **Invalid Route Name**:  
  Any route defined as `[@]` or `[@any-name]` will throw an error:  
  `Invalid route name: ${dir}`

**File Types Inside Directories**:  
There are two types of files that can be created inside these directories:

- **`route.ts`**:  
  This file handles all HTTP methods for the given route. So all function declared inside
  must be HTTP METHOD in 'uppercase'.
  
- **`middleware.ts`**:  
  This file handles middleware for that particular route. Middleware runs before the route logic in `route.ts`.

---

#### **To Setup**
```typescript
import { FileRouter, Kaze } from "@d3vtool/kazejs";


const app = new Kaze({
    router: FileRouter // important
});

// you can define error handler or validation error handler using
// 'app.globalErrorHandler'
// 'app.globalVErrorHandler'

app.listen(3000);
```

---

#### **Directory Structure**

```plaintext
project-path/
│
├── routes/
│   │
│   ├── products/
│   │   ├── middleware.ts        # Product-related middleware (permission check, etc.)
│   │   ├── route.ts             # Product-related routes (GET, POST /products)
│   │   └── [id]/                # Dynamic route for products by ID (e.g., /products/:id)
│   │       └── route.ts         # Route handler for /products/:id
│   │
│   ├── orders/
│   │   ├── middleware.ts        # Order-related middleware (auth, validation)
│   │   ├── route.ts             # Orders-related routes (POST /orders)
│   │   └── [id]/                # Dynamic route for orders by ID (e.g., /orders/:id)
│   │       └── route.ts         # Route handler for /orders/:id
│   │
│   ├── users/
│   │   ├── middleware.ts        # User-related middleware (input validation)
│   │   └── route.ts             # User routes (GET, POST /users)
│   │
│   └── middleware.ts            # Global middleware (logging, error handling, etc.)
│
└── app.ts                       # Main application file where routes are registered
```

---

#### **Code Examples**

---

##### **Authentication Middleware (`routes/@auth/middleware.ts`)**

```typescript
// routes/@auth/middleware.ts

import { Context, KazeNextFunction } from "@d3vtool/kazejs";

// Middleware to check if the user is authenticated
export function authenticate(ctx: KazeContext, next: KazeNextFunction) {
    const token = ctx.req.headers.authorization;

    if (!token) {
        ctx.res.statusCode(401);
        return ctx.res.json({ message: "Authorization required" });
    }

    try {
        // Simulate JWT verification (this should be a real JWT verification logic)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ctx.state.user = decoded;  // Attach the decoded user info to the request context
        return next();
    } catch (err) {
        ctx.res.statusCode(401);
        return ctx.res.json({ message: "Invalid token" });
    }
}
```

---

##### **Authentication Route (`routes/@auth/route.ts`)**

```typescript
// routes/@auth/route.ts

import { KazeContext } from "@d3vtool/kazejs";

// Handle login request (e.g., POST /@auth/login)
export function POST(ctx: KazeContext) {
    const { username, password } = ctx.req.body;

    // Simulate user authentication (use a real authentication service in a real app)
    if (username === "admin" && password === "password123") {
        ctx.res.json({ message: "Login successful", token: "fake-jwt-token" });
    } else {
        ctx.res.statusCode(401);
        ctx.res.json({ message: "Invalid credentials" });
    }
}
```

---

##### **Product Route (`routes/@products/route.ts`)**

```typescript
// routes/@products/route.ts

import { KazeContext } from "@d3vtool/kazejs";
import { Product } from "models/product";  // Assuming there's a Product model

// Handle creating a new product (e.g., POST /@products)
export function POST(ctx: KazeContext) {
    const { name, price } = ctx.req.body;

    // Validate product data
    if (!name || !price) {
        ctx.res.statusCode(400);
        return ctx.res.json({ message: "Name and price are required" });
    }

    // Simulate saving the product (in a real app, save to database)
    const newProduct = new Product({ name, price });
    newProduct.save();

    ctx.res.statusCode(201);
    ctx.res.json({ message: "Product created", product: newProduct });
}

// Handle getting all products (e.g., GET /@products)
export function GET(ctx: KazeContext) {
    // Simulate fetching products (in a real app, fetch from a database)
    const products = Product.findAll();

    ctx.res.statusCode(200);
    ctx.res.json({ products });
}
```

---

##### **Product Dynamic Route (`routes/@products/[id]/route.ts`)**

```typescript
// routes/@products/[id]/route.ts

import { KazeContext } from "@d3vtool/kazejs";
import { Product } from "models/product";  // Assuming there's a Product model

// Handle getting a product by ID (e.g., GET /@products/:id)
export function GET(ctx: KazeContext) {
    const { id } = ctx.req.params;

    // Simulate fetching the product by ID (use a real database in a real app)
    const product = Product.findById(id);

    if (!product) {
        ctx.res.statusCode(404);
        return ctx.res.json({ message: "Product not found" });
    }

    ctx.res.statusCode(200);
    ctx.res.json({ product });
}
```

---

##### **Global Middleware (`routes/middleware.ts`)**

```typescript
// routes/middleware.ts

import { Context, KazeNextFunction } from "@d3vtool/kazejs";

// Example of a global middleware for logging requests
export function logRequests(ctx: KazeContext, next: KazeNextFunction) {
    console.log(`[${new Date().toISOString()}] ${ctx.req.method} ${ctx.req.url}`);
    next();
}
```
---

### **Summary of How It Works**

1. **Global Middleware (`logRequests`)**: Logs every incoming request to the console.
2. **Authentication Middleware (`authenticate`)**: Ensures that requests to certain routes are authenticated.
3. **Routes**:
   - `/@auth`: Handles login and authentication (using `POST`).
   - `/@products`: Handles product management, such as creating and retrieving products.
   - `/@products/:id`: Retrieves a specific product based on its ID.

In this setup, you have:
- Global middleware that applies to all routes.
- Middleware specific to authentication, which only applies to routes that require it.
- Route definitions that correspond to real API endpoints, organized by resource (auth, products, etc.).