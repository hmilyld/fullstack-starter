package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.entity.AppState;
import com.hmilyld.fullstack.repository.AppStateRepository;
import java.security.SecureRandom;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppStateService {

@Autowired private AppStateRepository appStateRepository;

private final SecureRandom secureRandom = new SecureRandom();

@Transactional
public AppState getOrCreate() {
	return appStateRepository
		.findById(1L)
		.orElseGet(
			() -> {
			AppState state = new AppState();
			state.setId(1L);
			state.setSessionEpoch(newEpoch());
			state.setMenuLayoutVersion(1);
			return appStateRepository.save(state);
			});
}

public String getSessionEpoch() {
	return getOrCreate().getSessionEpoch();
}

public String newEpoch() {
	byte[] bytes = new byte[32];
	secureRandom.nextBytes(bytes);
	return HexFormat.of().formatHex(bytes);
}
}
