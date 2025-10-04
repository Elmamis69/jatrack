# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copia proyecto y compila
COPY pom.xml .
COPY src ./src
RUN mvn -DskipTests clean package

# ---------- Run stage ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copia el JAR ya construido
COPY --from=build /app/target/*.jar app.jar

# (Opcional) flags extras para la JVM
ENV JAVA_OPTS=""

# Render inyecta PORT; exponemos 8080 por convención
EXPOSE 8080

# Importante: usar sh -c para que ${PORT} se expanda
CMD ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=prod -Dserver.port=${PORT:-8080} -jar app.jar"]
