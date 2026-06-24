package com.checkupai;

import jakarta.annotation.PreDestroy;

import org.springframework.boot.SpringApplication;

import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)

public class CheckupAiApplication {

	public static void main(String[] args) {

		SpringApplication.run(CheckupAiApplication.class, args);

		System.out.println();

		System.out.println("=========");

		System.out.println("검진AI 서버 시작 🏥");

		System.out.println("=========");

		System.out.println();

	}

	@PreDestroy

	public void onShutdown() {

		System.out.println();

		System.out.println("=========");

		System.out.println("검진AI 서버 종료 👋");

		System.out.println("=========");

		System.out.println();

	}

}