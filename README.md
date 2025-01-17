# KazeJS

A flexible Node.js web framework built with TypeScript, focusing on dependency injection, routing, and middleware management. This package allows easy integration of external dependencies, such as a database, into your application. It supports dynamic route groups, global middleware, schema validation with error handling, and static file serving. With customizable error handlers for general and validation errors, it ensures a smooth development experience for building scalable web applications with type safety and clean architecture.

![KazeJS](https://raw.githubusercontent.com/ks961/imgs/refs/heads/main/KazeJS.png)

- **Features**
    - [**Routing [ static | dynamic ]**](#1-routing--static--dynamic-)
    - [**Route Grouping [ static | dynamic ]**](#2-route-grouping--static--dynamic-)
    - [**Middleware support**](#3-middleware-support)
    - [**Dependency injection**](#4-dependency-injection)
    - [**Schema validation [ query | params | json-body ]**](#5-schema-validation--query--params--json-body-)
    - [**Static file serving**](#6-static-file-serving)
    - [**Global middleware support**](#7-global-middleware-support)
    - [**Global error handling support [ Handler Errors | Schema validation Errors ]**](#8-global-error-handling-support--handler-errors--schema-validation-errors-)
    - [**Async Request Handling**](#9-async-request-handling)
    - [**Jwt Support**](#10-jwt-support)
    - [**Cors Handling**](#11-cors-handling)
    - [**File Upload**](#12-file-upload)

---

### 1. **Routing [ Static | Dynamic ]**

**Static Route Example**:  
```typescript
app.get("/api/users", async (ctx: KazeContext<Dep>) => {
    // Fetch and return a list of users
    const users = await ctx.dependencies?.db.query("SELECT * FROM users");
    ctx.res.json({ message: "List of users", users });
});
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

### 2. **Route Grouping [ Static | Dynamic ]**

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

### 3. **Middleware Support**

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

### 4. **Dependency Injection**

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

### 5. **Schema Validation [ Query | Params | JSON Body ]**

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

### 6. **Static File Serving**

**Static File Example**:  
```typescript
// Serve files from the 'public' folder (like HTML, CSS, images)
app.static("public");
```

---

### 7. **Global Middleware Support**

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

### 8. **Global Error Handling Support [ Handler Errors | Schema Validation Errors ]**

**Global Error Handler Example**:  
```typescript
app.globalErrorHandler((ctx: KazeContext, err: unknown) => {

    if(err instanceof YourCustomThrownError) {
        // handle it respectively
    } else {
        ctx.res.status(500).send({ error: "Internal Server Error" });
    }
});

// Validation-specific error handling [ Invoked when a validation error occurs from 'queryValidate', 'paramsValidate' ]
app.globalVErrorHandler((ctx: KazeContext, err: KazeValidationError) => {

    console.log(err.vErrors); // Schema keys with their error messages
    ctx.res.status(400).json({ error: err.message });
});
```

---

### 9. **Async Request Handling**

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

### 10. **Jwt Support**

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

### 11. **CORS Handling**

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

### 12. **File Upload**

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