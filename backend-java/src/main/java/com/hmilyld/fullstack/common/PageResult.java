package com.hmilyld.fullstack.common;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {
private List<T> list;
private long total;
private int page;
private int pageSize;
}
