"use client";

import s from "./CopyList.module.scss";
import Search from "../Search/Search";
import Pagination from "../Pagination/Pagination";
import { useDispatch, useSelector } from "react-redux";
import {
  copiesActions,
  getCopyWithCategory,
} from "../../../store/copy/copiesSlice";
import { Select } from "antd";
import NotFound from "../404/404";
import CardCopy from "../CardCopy/CardCopy";
import { useLocalizedText } from "../../../hook/useLocalizedText";
const CopyList = ({ title, list, data, windowWidth }: any) => {
  const dispatch = useDispatch<any>();
  const pagination = useSelector((state: any) => state.copies.pagination);
  const loading_copies = useSelector((state: any) => state.copies.loading_copies);
  const search = useSelector((state: any) => state.copies.search);
  const handleSelect = (value) => {
    dispatch(copiesActions.setSelectedCategory(value));
    dispatch(getCopyWithCategory());
  };
  const changaLang = useLocalizedText();

  function setPaginationParams(paginationParams) {
    dispatch(copiesActions.setPagination(paginationParams));
    dispatch(getCopyWithCategory());
  }

  const content = {
    error: "Bu categoriya uchun video topilmadi",
    error_ru: "Для этой категории видео не найдено",
  };
  return (
    <div className={s.wrapper}>
      <div className={s.row}>
        <div className={s.title}>{title}</div>
        {list.length > 0 && windowWidth <= 990 && (
          <div className={s.select}>
            <Select
              className={s.select}
              defaultValue={list[0].id}
              onChange={handleSelect}
              options={list.map((el) => ({
                value: el.id,
                label: el[changaLang("title")],
              }))}
            />
          </div>
        )}
        <Search
          value={search}
          onChange={(e) => {
            dispatch(copiesActions.setSearch(e.target.value));
            dispatch(getCopyWithCategory());
          }}
        />
      </div>

      <div className={s.list}>
        {loading_copies ? (
          <h2>Loading ...</h2>
        ) : data?.length > 0 ? (
          data.map((el) => <CardCopy key={el.id} data={el} />)
        ) : (
          <NotFound
            subTitle={content[changaLang("error")]}
            style={{ height: 300 }}
          />
        )}
      </div>

      {data?.length > 0 && (
        <Pagination
          paginationParams={pagination}
          setPaginationParams={setPaginationParams}
        />
      )}
    </div>
  );
};

export default CopyList;