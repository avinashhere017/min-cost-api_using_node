﻿# min-cost-api_using_node
This code snippet is a Node.js application using Express framework and NodeCache library to calculate the minimum cost of transferring products from different warehouses to a central location. Here's a breakdown of the key components:

1. **Dependencies**: The code requires the `express` and `node-cache` packages. `express` is used to create the web server, and `node-cache` is used for caching.

2. **Initialization**:
   - Creates an Express application.
   - Defines the port number as 3000.
   - Initializes a cache (`minCostCache`) with a time-to-live of 300 seconds.
   - Defines the warehouses, center stock, and distances between warehouses.

3. **Middleware**:
   - Configures Express to parse JSON requests.

4. **Functions**:
   - `calculate`: Calculates the minimum cost of transferring products based on weight and distance.
   - `helper`: Recursive function to calculate the minimum cost of transferring products between warehouses.
   - `costFromWt`: Calculates the cost based on weight.

5. **Routes**:
   - Defines a POST route `/calculate-cost` to handle cost calculation requests.
   - Converts the payload keys to uppercase.
   - Checks if the payload is missing and returns an error if so.
   - Processes the payload, calculates the total weight and cost, and caches the result if not already cached.
   - Handles invalid products and returns an error response.
   - Calculates the minimum cost using the `calculate` function.
   - Responds with the minimum cost.

6. **Server**:
   - Starts the server on the specified port.
   - Logs a message indicating the server is running.

Overall, this code sets up a server that calculates the minimum cost of transferring products from different warehouses to a central location based on weight and distance, handling requests through a POST endpoint.
