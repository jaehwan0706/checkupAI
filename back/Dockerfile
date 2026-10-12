FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=render
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=50", "-XX:MaxMetaspaceSize=160m", "-Xss512k", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-XX:CICompilerCount=1", "-XX:+ExitOnOutOfMemoryError", "-jar", "/app/app.jar"]
