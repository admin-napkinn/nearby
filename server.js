const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const schools = require("./schools.json");
const zipCoords = require("./zipCoords.json");

// Haversine
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.post("/nearest-schools", (req, res) => {
  const { name, home_zip } = req.body;
  if (!name || !home_zip)
    return res.status(400).json({ error: "Name and home_zip required" });

  const userLoc = zipCoords[home_zip];
  if (!userLoc)
    return res.status(400).json({ error: "Unknown ZIP code; add it to zipCoords.json" });

  const list = schools
    .map((s) => {
      const loc = zipCoords[s.zipcode];
      if (!loc) return null;
      return { ...s, distance: distanceMiles(userLoc.lat, userLoc.lng, loc.lat, loc.lng) };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2);

  res.json({ requestedBy: name, home_zip, nearestSchools: list });
});

app.use(express.static("public"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
