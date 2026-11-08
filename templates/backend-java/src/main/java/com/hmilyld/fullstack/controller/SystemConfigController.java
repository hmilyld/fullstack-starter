package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.SystemConfigResponse;
import com.hmilyld.fullstack.dto.SystemConfigUpdateRequest;
import com.hmilyld.fullstack.dto.TestEmailRequest;
import com.hmilyld.fullstack.entity.SystemConfig;
import com.hmilyld.fullstack.service.SystemConfigService;
import jakarta.mail.internet.MimeMessage;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/system")
public class SystemConfigController {

  @Autowired private SystemConfigService systemConfigService;

  @GetMapping("/config")
  @SaCheckPermission("settings")
  public ApiResponse<SystemConfigResponse> getConfig() {
    return systemConfigService.getConfigOut();
  }

  @PutMapping("/config")
  @SaCheckPermission("settings.edit")
  public ApiResponse<SystemConfigResponse> updateConfig(
      @RequestBody SystemConfigUpdateRequest req) {
    return systemConfigService.updateConfig(req);
  }

  @PostMapping("/test-email")
  @SaCheckPermission("settings.edit")
  public ApiResponse<Void> testEmail(@RequestBody @Valid TestEmailRequest req) {
    SystemConfig config = systemConfigService.requireSmtpReady();
    try {
      JavaMailSender mailSender = createMailSender(config);
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setSubject("测试邮件 - 管理系统");
      helper.setFrom(config.getSmtpFromEmail());
      helper.setTo(req.getEmail());
      helper.setText("这是一封测试邮件，说明您的邮件配置已成功生效。");
      mailSender.send(message);
      return new ApiResponse<>(0, "测试邮件发送成功", null);
    } catch (Exception e) {
      throw mapMailError(e);
    }
  }

  /** 把底层邮件异常翻译成契约里的中文提示。 */
  private RuntimeException mapMailError(Exception e) {
    String msg = e.getMessage();
    if (msg != null && msg.contains("Authentication")) {
      return new com.hmilyld.fullstack.common.AppException("SMTP认证失败，请检查用户名和密码");
    }
    if (msg != null && msg.contains("Connection")) {
      return new com.hmilyld.fullstack.common.AppException("无法连接到SMTP服务器，请检查服务器地址和端口");
    }
    return new com.hmilyld.fullstack.common.AppException("邮件发送失败: " + (msg != null ? msg : "未知错误"));
  }

  private JavaMailSender createMailSender(SystemConfig config) {
    JavaMailSenderImpl sender = new JavaMailSenderImpl();
    sender.setHost(config.getSmtpHost());
    sender.setPort(config.getSmtpPort());
    sender.setUsername(config.getSmtpUsername());
    sender.setPassword(config.getSmtpPassword());

    java.util.Properties props = sender.getJavaMailProperties();
    props.put("mail.smtp.auth", "true");
    props.put("mail.smtp.timeout", "10000");
    props.put("mail.smtp.connectiontimeout", "10000");

    if (Boolean.TRUE.equals(config.getSmtpUseSsl())) {
      props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
      props.put("mail.smtp.socketFactory.port", String.valueOf(config.getSmtpPort()));
    } else {
      props.put("mail.smtp.starttls.enable", "true");
    }

    return sender;
  }
}
