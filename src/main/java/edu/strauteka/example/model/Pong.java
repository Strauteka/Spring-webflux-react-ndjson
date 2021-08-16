package edu.strauteka.example.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pong {
    private Long id;
    private Integer pong;
    private Integer timeMs;
}
