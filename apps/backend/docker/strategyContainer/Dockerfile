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
        python3 \
        python3-pip \
        python3-venv \
        procps \
        tini \
        tzdata \
        unzip \
    && rm -rf /var/lib/apt/lists/*

ENV STRATEGY_HOME=/opt/strategy \
    STRATEGY_WORKDIR=/opt/strategy/workspace \
    STRATEGY_LIB_DIR=/opt/strategy/lib \
    STRATEGY_TMP_DIR=/tmp \
    RUN_TIMEOUT_SECONDS=300 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPYCACHEPREFIX=/tmp/pycache \
    MPLCONFIGDIR=/tmp/matplotlib \
    JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:InitialRAMPercentage=25.0 -XX:+ExitOnOutOfMemoryError -XX:ActiveProcessorCount=2 -Djava.io.tmpdir=/tmp -Duser.home=/opt/strategy -Dfile.encoding=UTF-8 -Djava.awt.headless=true"

RUN groupadd --system strategy \
    && useradd --system --gid strategy --create-home --home-dir /opt/strategy --shell /usr/sbin/nologin strategy \
    && mkdir -p /opt/strategy/bin /opt/strategy/workspace /opt/strategy/tmp /opt/strategy/logs /opt/strategy/venv \
    && chown -R strategy:strategy /opt/strategy \
    && chmod 700 /opt/strategy/workspace /opt/strategy/tmp

COPY --from=deps /opt/strategy/lib /opt/strategy/lib
COPY entrypoint.sh /opt/strategy/bin/entrypoint.sh

RUN python3 -m venv /opt/strategy/venv

ENV PATH="/opt/strategy/venv/bin:${PATH}"

RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir \
        backtrader \
        ccxt \
        matplotlib \
        networkx \
        numba \
        numpy \
        pandas \
        pandas-datareader \
        pyarrow \
        pyyaml \
        requests \
        scikit-learn \
        scipy \
        seaborn \
        statsmodels \
        ta \
        yfinance \
    && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch

RUN chmod 0555 /opt/strategy/bin/entrypoint.sh \
    && find /opt/strategy/lib -type f -name '*.jar' -exec chmod 0444 {} +

USER strategy:strategy
WORKDIR /opt/strategy/workspace

ENTRYPOINT ["/usr/bin/tini", "--", "/opt/strategy/bin/entrypoint.sh"]
CMD ["java", "-version"]
