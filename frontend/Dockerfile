# Build Stage
FROM node:18 AS builder

WORKDIR /app
# กำหนด โฟลเดอร์ทำงานหลัก (working directory) ภายใน container
COPY . .
RUN npm install
# ติดตั้ง dependencies ของโปรเจกต์จาก package.json
RUN npm run build

# Production Stage
FROM node:18

WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3000
# เปิดพอร์ต 3000 ให้ container เชื่อมต่อจากภายนอก
CMD ["npm", "start"]
