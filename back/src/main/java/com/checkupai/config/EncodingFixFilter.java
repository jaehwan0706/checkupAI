package com.checkupai.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.*;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class EncodingFixFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(EncodingFixFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String ct = request.getContentType();
        if (ct == null || !ct.toLowerCase().contains("application/json")) {
            chain.doFilter(request, response);
            return;
        }

        byte[] raw = request.getInputStream().readAllBytes();
        byte[] body = toUtf8(raw);
        chain.doFilter(new BodyCachedRequest(request, body), response);
    }

    private static byte[] toUtf8(byte[] bytes) {
        try {
            StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes));
            return bytes;
        } catch (CharacterCodingException e) {
            try {
                String text = new String(bytes, Charset.forName("MS949"));
                log.debug("Request body re-encoded CP949 → UTF-8");
                return text.getBytes(StandardCharsets.UTF_8);
            } catch (Exception ex) {
                return bytes;
            }
        }
    }

    private static final class BodyCachedRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        BodyCachedRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream bais = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                public boolean isFinished() { return bais.available() == 0; }
                public boolean isReady()    { return true; }
                public void setReadListener(ReadListener l) {}
                public int read()           { return bais.read(); }
            };
        }

        @Override
        public BufferedReader getReader() throws IOException {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }
    }
}
