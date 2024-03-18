const express = require("express");
const NodeCache = require("node-cache");

const app = express();
const port = process.env.PORT || 3000;

const minCostCache = new NodeCache({ stdTTL: 300 });

const warehouses = ["L1", "C1", "C2", "C3"];

const centerStock = {
  C1: { A: 3, B: 2, C: 8 },
  C2: { D: 12, E: 25, F: 15 },
  C3: { G: 0.5, H: 1, I: 2 }
};

const distances = {
  C1_C2: 4,
  C2_C3: 3,
  C3_C1: 5,
  C3_L1: 2,
  C1_L1: 3,
  C2_L1: 2.5
};

app.use(express.json());

function calculate(totalWt, wtObj) {
  const sumWts = {
    C1: Object.values(wtObj.C1).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
    C2: Object.values(wtObj.C2).reduce((accumulator, currentValue) => accumulator + currentValue, 0),
    C3: Object.values(wtObj.C3).reduce((accumulator, currentValue) => accumulator + currentValue, 0)
  };

  function helper(warehouse, cwt, wtTransfered, visited, cache) {
    const key = `${warehouse}_${cwt}_${wtTransfered}`;

    if (cache[key]) {
      return cache[key];
    }

    if (wtTransfered === totalWt) {
      if (warehouse === "L1") return 0;

      const res =
        costFromWt(cwt) * distances[warehouse + "_L1"] +
        helper("L1", cwt, wtTransfered, visited, cache);

      cache[key] = res;

      return res;
    }

    let ans = Number.MAX_VALUE;

    for (const newWarehouse of warehouses) {
      if (
        visited[newWarehouse] ||
        (!sumWts[newWarehouse] && newWarehouse !== "L1") ||
        newWarehouse === warehouse
      )
        continue;

      const newWt = sumWts[newWarehouse] ? sumWts[newWarehouse] : 0;
      const distance =
        distances[warehouse + "_" + newWarehouse] ||
        distances[newWarehouse + "_" + warehouse];

      ans = Math.min(
        ans,
        (warehouse
          ? distance * (warehouse === "L1" ? 10 : costFromWt(cwt + newWt))
          : 0) +
        helper(
          newWarehouse,
          cwt + sumWts[newWarehouse] ? sumWts[newWarehouse] : 0,
          wtTransfered + newWt,
          {
            ...visited,
            [newWarehouse]: newWarehouse !== "L1",
          },
          cache
        )
      );
    }

    cache[key] = ans;

    return ans;
  }

  function costFromWt(wt) {
    if (wt <= 5) return 10;

    return 10 + Math.ceil((wt - 5) / 5) * 8;
  }

  const visited = {};
  const min_cost = helper("", 0, 0, visited, {});

  return min_cost;
}

app.post("/calculate-cost", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "Product List is missing",
        errorCode: "producListMissing",
      });
    }

    const upperCasePayload = {};
    for (const key in req.body) {
      upperCasePayload[key.toUpperCase()] = req.body[key];
    }

    let min_cost = 0;
    if (minCostCache.has(JSON.stringify(upperCasePayload))) {
      min_cost = minCostCache.get(JSON.stringify(upperCasePayload)) || 0;
    } else {
      const wtObj = {
        C1: {},
        C2: {},
        C3: {},
      };
      let totalWt = 0;
      const invalidProducts = [];

      for (const i in req.body) {
        const item = i.toUpperCase();
        if (Object.keys(centerStock.C1).includes(item)) {
          totalWt += wtObj.C1[item] = centerStock.C1[item] * req.body[i];
        } else if (Object.keys(centerStock.C2).includes(item)) {
          totalWt += wtObj.C2[item] = centerStock.C2[item] * req.body[i];
        } else if (Object.keys(centerStock.C3).includes(item)) {
          totalWt += wtObj.C3[item] = centerStock.C3[item] * req.body[i];
        } else {
          invalidProducts.push(i);
        }
      }

      if (invalidProducts.length)
        return res.status(400).json({
          error: `Product is not available in the warehouse. Please choose a valid product.`,
          errorCode: "productNotValid",
          invalidProducts,
        });
      min_cost = calculate(totalWt, wtObj);
    }
    minCostCache.set(JSON.stringify(upperCasePayload), min_cost);

    res.json({ min_cost });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred.", errorCode: "internalServerError" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
