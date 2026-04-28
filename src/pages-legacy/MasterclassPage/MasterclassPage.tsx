"use client";

import Container from "../../components/ui/Container/Container";
import s from "./MasterclassPage.module.scss";
import Pagination from "../../components/ui/Pagination/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  getMasterclassCategory,
  masterclassCategoryActions,
} from "../../store/masterclass/masterclassSlice";
import NotFound from "../../components/ui/404/404";
import { Link } from "@/lib/router-compat";
import { useLocalizedText } from "../../hook/useLocalizedText";
import { Helmet } from "@/lib/helmet-compat";
// import TrenersList from "../../components/ui/TrenersList/TrenersList";

const MasterclassPage = () => {
  const dispatch = useDispatch<any>();
  const treners = useSelector((state: any) => state.masterclass.masterclassCategory);
  const pagination = useSelector((state: any) => state.masterclass.pagination);
  const changaLang = useLocalizedText();
  useEffect(() => {
    dispatch(getMasterclassCategory());
  }, []);

  function setPaginationParams(paginationParams) {
    dispatch(masterclassCategoryActions.setPagination(paginationParams));
    dispatch(getMasterclassCategory());
  }
  const content = {
    title: "Masterclasslar",
    title_ru: "Мастерклассы",
    subtitle: "Masterclass",
    subtitle_ru: "Мастеркласс",
    uz: "O`zbekcha",
    uz_ru: "Узбекский",
  };
  return (
    <Container>

      <Helmet>
        <title > CoachingZona Masterclasslar</title>
        <meta name="description" content="CoachingZona  Masterclasslar ,Coaching Zona Masterclasslar , Murabbiylardan masterclaslari , Masterclasslar videolari" />
        <link rel='canonical' href='https://coachingzona.uz/masterclass' />
      </Helmet>
      <div className={s.wrapper}>
        {treners?.length > 0 ? (
          <div className={s.left}>
            <div className={s.title}>{content[changaLang('title')]}</div>
            <div className={s.hero}>
              <Link to={treners[0].id} className={s.img}>
                <img
                  src={
                    "https://storage.googleapis.com/telecom2003/" +
                    treners[0].img_link
                  }
                  alt="trener"
                />
              </Link>
              <div className={s.role}>{content[changaLang('subtitle')]}</div>
              <Link to={treners[0].id} className={s.name}>
                {treners[0][changaLang('title')]}
              </Link>
              <div className={s.about}>{treners[0][changaLang('title_descrioption')]}</div>
            </div>
            <div className={s.treners_list}>
              {treners.slice(1).map((el) => (
                <Link to={el.id} key={el.id} className={s.trener}>
                  <div className={s.trener_img}>
                    <img
                      src={
                        "https://storage.googleapis.com/telecom2003/" +
                        el.img_link
                      }
                      alt="trener"
                    />
                  </div>
                  <div className={s.trener_role}>{content[changaLang('subtitle')]}</div>
                  <div className={s.trener_name}>{el[changaLang('title')]}</div>
                </Link>
              ))}
            </div>
            <Pagination
              paginationParams={pagination}
              setPaginationParams={setPaginationParams}
            />
          </div>
        ) : (
          <NotFound />
        )}
        {/* <TrenersList /> */}
      </div>
    </Container>
  );
};

export default MasterclassPage;