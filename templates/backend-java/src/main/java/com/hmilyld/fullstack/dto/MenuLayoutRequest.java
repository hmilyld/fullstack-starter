package com.hmilyld.fullstack.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class MenuLayoutRequest {
@NotNull private Integer version;

@Valid @NotEmpty private List<Group> groups = new ArrayList<>();

@Data
public static class Group {
	@NotNull private String id;

	@NotNull private Integer sortOrder;

	@Valid @NotNull private List<Item> items = new ArrayList<>();
}

@Data
public static class Item {
	@NotNull private String permissionCode;

	@NotNull private Integer sortOrder;
}
}
