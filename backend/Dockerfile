# Build stage
FROM rust:latest as builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim
WORKDIR /app

# Install required libraries
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy binary and data
COPY --from=builder /app/target/release/clan-war-api .
COPY data ./data

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./clan-war-api"]
