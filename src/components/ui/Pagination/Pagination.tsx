"use client";

import { Button } from "antd";
import s from "./Pagination.module.scss";
import ToLeft from "../../svg/ToLeft";
import MyButton from "../MyButton/MyButton";
import ToRight from "../../svg/ToRight";
import MySelect from "../MySelect/MySelect";
import { useSelector } from "react-redux";

const Pagination = ({ paginationParams, setPaginationParams }: any) => {
  const lang = useSelector((state: any) => state.lang.lang);
  const getLocalizedText = (content) => {
    return content && content[lang] ? content[lang] : content;
  };

  if (!paginationParams) {
    return <div>Loading ...</div>;
  }

  const content = {
    title: {
      uz: "Keyingi sahifa",
      ru: "Следуюшая страница",
    },
    page: {
      uz: "Sahifa",
      ru: "Страница",
    },
    from: {
      uz: paginationParams.totalPages + " ta dan",
      ru: "из " + paginationParams.totalPages,
    },
  };
  return (
    <div className={s.pagination}>
      <div className={s.btns}>
        <Button
          onClick={() => {
            if (+paginationParams.currentPage > 1) {
              setPaginationParams({
                ...paginationParams,
                currentPage: paginationParams.currentPage - 1,
              });
            }
          }}
        >
          <ToLeft />
        </Button>
        <MyButton
          onClick={() => {
            if (+paginationParams.currentPage < +paginationParams.totalPages) {
              setPaginationParams({
                ...paginationParams,
                currentPage: +paginationParams.currentPage + 1,
              });
            }
          }}
          className={s.btn}
          type="primary"
        >
          <span> {getLocalizedText(content.title)}</span>
          <ToRight />
        </MyButton>
      </div>

      <div className={s.number}>
        <span> {getLocalizedText(content.page)}</span>
        <span className={s.span}>{paginationParams.currentPage}</span>

        <span> {getLocalizedText(content.from)}</span>

        <div className={s.select}>
          <MySelect
            onSelect={(v) =>
              setPaginationParams({
                ...paginationParams,
                currentPage: 1,
                pageSize: v,
              })
            }
            defaultValue={+paginationParams.pageSize}
            options={[
              {
                value: 5,
                name: 5,
              },
              {
                value: 10,
                name: 10,
              },
              {
                value: 15,
                name: 15,
              },
              {
                value: 20,
                name: 20,
              },
              {
                value: 25,
                name: 25,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Pagination;