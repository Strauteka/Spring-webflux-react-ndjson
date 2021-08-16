package edu.strauteka.example.controller;

import edu.strauteka.example.dto.Ping;
import edu.strauteka.example.model.Pong;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SynchronousSink;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@RestController
@RequestMapping(produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_NDJSON_VALUE})
public class PingController {
    @CrossOrigin(origins = "http://localhost:3000")
    @GetMapping(value = "ping")
    Flux<Pong> calculateBestScore(Ping ping) {
        log.info("{}", ping);
        AtomicInteger highestSoFarState = new AtomicInteger(Integer.MIN_VALUE);
        long abstractCalcStartTime = System.currentTimeMillis();
        return Flux
                .generate(() -> 1L,
                        (Long state, SynchronousSink<Long> sink) -> {
                            sink.next(state);
                            return state + 1L;
                        })
                .take(ping.getTimes())
                //.parallel()
                .flatMap(n ->
                        Mono.just(n)
                                .delayElement(
                                        Duration.ofMillis(
                                                ThreadLocalRandom
                                                        .current()
                                                        .nextInt(ping.getDelayMsLow(), ping.getDelayMsHigh()))))
                .map(id -> new Pong(id, ThreadLocalRandom
                        .current()
                        .nextInt(0, ping.getGoal()), Long.valueOf(System.currentTimeMillis() - abstractCalcStartTime).intValue())
                )
                //.sequential()
                .filter(rndValue -> {
                    int state;
                    //multiple threads, async, no need?
                    while (rndValue.getPong() > (state = highestSoFarState.intValue())) {
                        if (highestSoFarState.compareAndSet(state, rndValue.getPong())) {
                            return true;
                        }
                    }
                    return false;
                })
                .doOnNext(n -> log.info("Ping {}", n))
                .doOnError((error) -> log.error("Error", error))
                .doOnComplete(() -> log.info("doOnComplete"))
                .doFinally((sign) -> log.info("doFinally: {}", sign))
                .doAfterTerminate(() -> log.info("doAfterTerminate")).
                        doOnDiscard(String.class, e -> log.info("doOnDiscard: {}", e));
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @GetMapping("load")
    Flux<Pong> getLoad(Ping ping) {
        long abstractCalcStartTime = System.currentTimeMillis();
        return Flux
                .range(0, ping.getTimes())
                .delayElements(Duration.ofMillis(
                        ThreadLocalRandom
                                .current()
                                .nextInt(ping.getDelayMsLow(), ping.getDelayMsHigh())))
                .map(n -> new Pong(
                        Long.valueOf(n),
                        n,
                        Long.valueOf(System.currentTimeMillis() - abstractCalcStartTime).intValue()));
    }
}
