--
-- PostgreSQL database dump
--

\restrict spWe42owxoOhPlJfo8fqFL4E19Zo7ADxJWAKY6BM6CTjAcIKzvLTaaaabOWa1b1

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analysis_jobs; Type: TABLE; Schema: public; Owner: strategyuser
--

CREATE TABLE public.analysis_jobs (
    id integer NOT NULL,
    strategy_id bigint NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    result text,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp without time zone,
    completed_at timestamp without time zone
);


ALTER TABLE public.analysis_jobs OWNER TO strategyuser;

--
-- Name: analysis_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: strategyuser
--

CREATE SEQUENCE public.analysis_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analysis_jobs_id_seq OWNER TO strategyuser;

--
-- Name: analysis_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: strategyuser
--

ALTER SEQUENCE public.analysis_jobs_id_seq OWNED BY public.analysis_jobs.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: strategyuser
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO strategyuser;

--
-- Name: stock_data; Type: TABLE; Schema: public; Owner: strategyuser
--

CREATE TABLE public.stock_data (
    id integer NOT NULL,
    ticker character varying(10) NOT NULL,
    period character(1) NOT NULL,
    trade_date date NOT NULL,
    trade_time time without time zone DEFAULT '00:00:00'::time without time zone,
    open numeric(12,6),
    high numeric(12,6),
    low numeric(12,6),
    close numeric(12,6),
    volume bigint,
    open_interest bigint DEFAULT 0
);


ALTER TABLE public.stock_data OWNER TO strategyuser;

--
-- Name: stock_data_id_seq; Type: SEQUENCE; Schema: public; Owner: strategyuser
--

CREATE SEQUENCE public.stock_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_data_id_seq OWNER TO strategyuser;

--
-- Name: stock_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: strategyuser
--

ALTER SEQUENCE public.stock_data_id_seq OWNED BY public.stock_data.id;


--
-- Name: strategies; Type: TABLE; Schema: public; Owner: strategyuser
--

CREATE TABLE public.strategies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    code text NOT NULL,
    configuration text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    owner_email character varying(255),
    is_public boolean DEFAULT true
);


ALTER TABLE public.strategies OWNER TO strategyuser;

--
-- Name: strategies_id_seq; Type: SEQUENCE; Schema: public; Owner: strategyuser
--

CREATE SEQUENCE public.strategies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.strategies_id_seq OWNER TO strategyuser;

--
-- Name: strategies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: strategyuser
--

ALTER SEQUENCE public.strategies_id_seq OWNED BY public.strategies.id;


--
-- Name: strategy_sharing; Type: TABLE; Schema: public; Owner: strategyuser
--

CREATE TABLE public.strategy_sharing (
    id integer NOT NULL,
    strategy_id bigint NOT NULL,
    shared_with_email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.strategy_sharing OWNER TO strategyuser;

--
-- Name: strategy_sharing_id_seq; Type: SEQUENCE; Schema: public; Owner: strategyuser
--

CREATE SEQUENCE public.strategy_sharing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.strategy_sharing_id_seq OWNER TO strategyuser;

--
-- Name: strategy_sharing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: strategyuser
--

ALTER SEQUENCE public.strategy_sharing_id_seq OWNED BY public.strategy_sharing.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: strategyuser
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO strategyuser;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: strategyuser
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO strategyuser;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: strategyuser
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: analysis_jobs id; Type: DEFAULT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.analysis_jobs ALTER COLUMN id SET DEFAULT nextval('public.analysis_jobs_id_seq'::regclass);


--
-- Name: stock_data id; Type: DEFAULT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.stock_data ALTER COLUMN id SET DEFAULT nextval('public.stock_data_id_seq'::regclass);


--
-- Name: strategies id; Type: DEFAULT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.strategies ALTER COLUMN id SET DEFAULT nextval('public.strategies_id_seq'::regclass);


--
-- Name: strategy_sharing id; Type: DEFAULT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.strategy_sharing ALTER COLUMN id SET DEFAULT nextval('public.strategy_sharing_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: analysis_jobs; Type: TABLE DATA; Schema: public; Owner: strategyuser
--

COPY public.analysis_jobs (id, strategy_id, status, result, error_message, created_at, started_at, completed_at) FROM stdin;
1	8	completed	{"performance": 0.15, "trades": 42, "winRate": 0.65}	\N	2026-04-10 21:37:29.119768	2026-04-10 21:37:29.138742	2026-04-10 21:37:34.147964
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: strategyuser
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	0001	create tables	SQL	V0001__create_tables.sql	-1325221564	strategyuser	2026-03-31 09:24:25.539656	30	t
2	0002	add user and strategy privacy	SQL	V0002__add_user_and_strategy_privacy.sql	-1818166677	strategyuser	2026-04-12 22:40:40.900471	48	t
\.


--
-- Data for Name: stock_data; Type: TABLE DATA; Schema: public; Owner: strategyuser
--

COPY public.stock_data (id, ticker, period, trade_date, trade_time, open, high, low, close, volume, open_interest) FROM stdin;
\.


--
-- Data for Name: strategies; Type: TABLE DATA; Schema: public; Owner: strategyuser
--

COPY public.strategies (id, name, description, code, configuration, created_at, updated_at, owner_email, is_public) FROM stdin;
1	string	string	string	string	2026-04-02 19:00:27.38189	2026-04-02 19:00:27.38189	\N	t
2	string	string	string	string	2026-04-02 19:02:24.882288	2026-04-02 19:02:24.882288	\N	t
3	string	string	string	string	2026-04-02 19:02:49.261698	2026-04-02 19:02:49.261698	\N	t
4	string	string	string	string	2026-04-02 19:08:22.947922	2026-04-02 19:08:22.947922	\N	t
5	string	string	string	string	2026-04-02 19:10:20.996254	2026-04-02 19:10:20.996254	\N	t
6	string	string	string	string	2026-04-02 19:10:26.343487	2026-04-02 19:10:26.343487	\N	t
7	string	string	string	string	2026-04-02 19:10:29.402899	2026-04-02 19:10:29.402899	\N	t
8	string	string	string	string	2026-04-02 19:10:52.569031	2026-04-02 19:10:52.569031	\N	t
\.


--
-- Data for Name: strategy_sharing; Type: TABLE DATA; Schema: public; Owner: strategyuser
--

COPY public.strategy_sharing (id, strategy_id, shared_with_email, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: strategyuser
--

COPY public.users (id, email, name, created_at, updated_at) FROM stdin;
\.


--
-- Name: analysis_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: strategyuser
--

SELECT pg_catalog.setval('public.analysis_jobs_id_seq', 1, true);


--
-- Name: stock_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: strategyuser
--

SELECT pg_catalog.setval('public.stock_data_id_seq', 1, false);


--
-- Name: strategies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: strategyuser
--

SELECT pg_catalog.setval('public.strategies_id_seq', 11, true);


--
-- Name: strategy_sharing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: strategyuser
--

SELECT pg_catalog.setval('public.strategy_sharing_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: strategyuser
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: analysis_jobs analysis_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.analysis_jobs
    ADD CONSTRAINT analysis_jobs_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: stock_data stock_data_pkey; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.stock_data
    ADD CONSTRAINT stock_data_pkey PRIMARY KEY (id);


--
-- Name: strategies strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);


--
-- Name: strategy_sharing strategy_sharing_pkey; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.strategy_sharing
    ADD CONSTRAINT strategy_sharing_pkey PRIMARY KEY (id);


--
-- Name: stock_data uq_stock_data; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.stock_data
    ADD CONSTRAINT uq_stock_data UNIQUE (ticker, trade_date, trade_time);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: strategyuser
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_strategies_is_public; Type: INDEX; Schema: public; Owner: strategyuser
--

CREATE INDEX idx_strategies_is_public ON public.strategies USING btree (is_public);


--
-- Name: idx_strategies_owner_email; Type: INDEX; Schema: public; Owner: strategyuser
--

CREATE INDEX idx_strategies_owner_email ON public.strategies USING btree (owner_email);


--
-- Name: idx_strategy_sharing_shared_with_email; Type: INDEX; Schema: public; Owner: strategyuser
--

CREATE INDEX idx_strategy_sharing_shared_with_email ON public.strategy_sharing USING btree (shared_with_email);


--
-- Name: idx_strategy_sharing_strategy_id; Type: INDEX; Schema: public; Owner: strategyuser
--

CREATE INDEX idx_strategy_sharing_strategy_id ON public.strategy_sharing USING btree (strategy_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: strategyuser
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: analysis_jobs analysis_jobs_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.analysis_jobs
    ADD CONSTRAINT analysis_jobs_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON DELETE CASCADE;


--
-- Name: strategy_sharing strategy_sharing_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: strategyuser
--

ALTER TABLE ONLY public.strategy_sharing
    ADD CONSTRAINT strategy_sharing_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict spWe42owxoOhPlJfo8fqFL4E19Zo7ADxJWAKY6BM6CTjAcIKzvLTaaaabOWa1b1

