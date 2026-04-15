FROM docker.io/library/maven:3.9.11-eclipse-temurin-21 AS deps

WORKDIR /build
COPY strategy-libs-pom.xml pom.xml

# Preload the libraries strategies are expected to use most often so containers
# can compile and start quickly without fetching dependencies at runtime.
RUN mvn -q -B -DskipTests dependency:copy-dependencies \
    -DoutputDirectory=/opt/strategy/lib


FROM docker.io/library/eclipse-temurin:21-jdk-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        coreutils \
        curl \
        findutils \
        jq \
        procps \
        tini \
        tzdata \
        unzip \
    && rm -rf /var/lib/apt/lists/*

ENV STRATEGY_HOME=/opt/strategy \
    STRATEGY_WORKDIR=/opt/strategy/workspace \
    STRATEGY_LIB_DIR=/opt/strategy/lib \
    STRATEGY_TMP_DIR=/opt/strategy/workspace/tmp \
    RUN_TIMEOUT_SECONDS=300 \
    JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:InitialRAMPercentage=25.0 -XX:+ExitOnOutOfMemoryError -XX:ActiveProcessorCount=2 -Djava.io.tmpdir=/opt/strategy/workspace/tmp -Duser.home=/opt/strategy -Dfile.encoding=UTF-8 -Djava.awt.headless=true"

RUN groupadd --system strategy \
    && useradd --system --gid strategy --create-home --home-dir /opt/strategy --shell /usr/sbin/nologin strategy \
    && mkdir -p /opt/strategy/bin /opt/strategy/workspace /opt/strategy/tmp /opt/strategy/logs \
    && chown -R strategy:strategy /opt/strategy \
    && chmod 700 /opt/strategy/workspace /opt/strategy/tmp

COPY --from=deps /opt/strategy/lib /opt/strategy/lib
COPY entrypoint.sh /opt/strategy/bin/entrypoint.sh

RUN chmod 0555 /opt/strategy/bin/entrypoint.sh \
    && find /opt/strategy/lib -type f -name '*.jar' -exec chmod 0444 {} +

USER strategy:strategy
WORKDIR /opt/strategy/workspace

ENTRYPOINT ["/usr/bin/tini", "--", "/opt/strategy/bin/entrypoint.sh"]
CMD ["java", "-version"]
