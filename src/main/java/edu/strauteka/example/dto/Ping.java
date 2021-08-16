package edu.strauteka.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ping {
    private Integer times = 100;
    private Integer delayMsLow = 1000;
    private Integer delayMsHigh = 3000;
    private Integer goal = 101;
}
