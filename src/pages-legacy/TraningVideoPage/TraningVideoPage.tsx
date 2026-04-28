"use client";

import { Helmet } from "@/lib/helmet-compat";
import Container from "../../components/ui/Container/Container";
import s from "./TraningVideoPage.module.scss";
import PlayList from "../../components/ui/PlayList/PlayList";
import TimeIcon from "../../components/svg/Tiime";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  getTreningSubCatWithCateg,
  getVideoWithSubCat,
  treningSubCategoryActions,
} from "../../store/trening/treningSubCatSlice";
import { useNavigate, useParams } from "@/lib/router-compat";
import { Select, message } from "antd";
import NotFound from "../../components/ui/404/404";
import { useLocalizedText } from "../../hook/useLocalizedText";
import MyButton from "../../components/ui/MyButton/MyButton";
// import upperFirstInText from '../../assets/utils'
const TraningVideoPage = () => {
  const dispatch = useDispatch<any>();
  const params = useParams();
  const navigate = useNavigate();
  const subCategories = useSelector(
    (state: any) => state.treningSubCategory.treningSubCategory
  );

  const changaLang = useLocalizedText();
  const selectedSubCat = useSelector(
    (state: any) => state.treningSubCategory.subCategory
  );
  const loading = useSelector((state: any) => state.treningSubCategory.loading);
  const error_video = useSelector(
    (state: any) => state.treningSubCategory.error_video
  );
  const videos = useSelector((state: any) => state.treningSubCategory.videos);
  const selectedCategory = useSelector(
    (state: any) => state.treningSubCategory.selectedCategory
  );
  const selected_video = useSelector(
    (state: any) => state.treningSubCategory.selected_video
  );
  const loading_video = useSelector(
    (state: any) => state.treningSubCategory.loading_video
  );

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (error_video?.message?.length) {
      messageApi.info(error_video.message);
      if (error_video.status == 401) {
        navigate("/login");
      }
    }
  }, [error_video]);

  useEffect(() => {
    dispatch(getTreningSubCatWithCateg(params.id))
      .unwrap()
      .then((result) => {
        const currentSelectedSubCat =
          result.Training_sub_category.length > 0
            ? result.Training_sub_category[0].id
            : null;
        if (currentSelectedSubCat) {
          dispatch(treningSubCategoryActions.setSubCat(currentSelectedSubCat));
          dispatch(getVideoWithSubCat())
            .unwrap()
            .then((result) => {
              if (result.length > 0) {
                dispatch(treningSubCategoryActions.setSelectedVideo(result[0]));
              }
            })
            .catch((error) => {
              messageApi.info(error.message);
            });
        }
      })
      .catch((error) => {
        messageApi.info(error.message);
      });
  }, [dispatch, params.id]);

  const content = {
    error: "Bu categoriya uchun sub categoriya topilmadi",
    error_ru: "Для этой категории суб-категория не найдено",
    title: "Mashg‘ulotlar video to‘plami",
    title_ru: "Видео сборник упражнений.",
    videos: "Videodarsliklar soni",
    videos_ru: "Количество видеоуроков",
    count: videos.length + " ta",
    count_ru: videos.length,
    cours_info: "Kurs haqida ma’lumot",
    cours_info_ru: "Информация о курсе",
    login_text: "To'liq videolarni olish uchun tizimga kiring",
    login_text_ru: "Войдите, чтобы получить полные видео",
  };

  if (!(subCategories.length > 0)) {
    return (
      <NotFound
        style={{ margin: "40px 0px" }}
        subTitle={content[changaLang("error")]}
      />
    );
  }
  return (
    <Container>
            <Helmet>
        <title>CoachingZona Mashg‘ulot videolari</title>
        <meta name="description" content="CoachingZona Mashg‘ulotlar videolari  Coaching Zona Mashg‘ulotlar videolari" />
        <link rel='canonical' href='https://coachingzona.uz/training' />
      </Helmet>
      <div className={s.row}>
        <div className={s.left}>
          <div className={s.video}>
            {loading_video && <p>Loading...</p>}
            {selected_video ? (
              <video
                width="100%"
                height="auto"
                autoPlay
                playsInline
                muted
                loop
                controls
                src={
                  "https://storage.googleapis.com/telecom2003/" +
                  selected_video.video_link
                }
              />
            ) : (
              <NotFound style={{ padding: 50 }} />
            )}
          </div>
          <div className={s.img}>
            {selected_video && (
              <img
                src={
                  "https://storage.googleapis.com/telecom2003/" +
                  selected_video.tactic_img
                }
                alt="plan"
              />
            )}
          </div>
          <div className={s.description}>
            {selected_video && selected_video[changaLang("description_tactic")]}
          </div>
          {selectedCategory && (
            <div className={s.post}>
              <h2 className={s.title}>{content[changaLang("cours_info")]} </h2>
              <div className={s.text}>
                {selectedCategory[changaLang("description_training")]}
              </div>
            </div>
          )}
        </div>
        <div className={s.right}>
          {loading && <p>Loading...</p>}
          {subCategories.length > 0 && (
            <Select
              className={s.select}
              defaultValue={selectedSubCat}
              onChange={(selectedValue) => {
                dispatch(treningSubCategoryActions.setSubCat(selectedValue));
                dispatch(getVideoWithSubCat())
                  .unwrap()
                  .then((result) => {
                    if (result.length > 0) {
                      dispatch(
                        treningSubCategoryActions.setSelectedVideo(result[0])
                      );
                    }
                  })
                  .catch((error) => {
                    messageApi.info(error.message);
                  });
              }}
              options={subCategories.map((el) => (
                // console.log(el)
                {
                value: el.id,
                label:  el[changaLang("title")].charAt(0).toUpperCase() +  el[changaLang("title")].slice(1),
              }
              ))
            }
            />
          )}

          {loading_video && <p>Loading...</p>}

          {contextHolder}
          {videos.length > 0 && (
            <PlayList videos={videos} title={content[changaLang("title")]} />
          )}
          <div className={s.time}>
            <div className={s.row_time}>
              <TimeIcon />
              <div className={s.label}>{content[changaLang("videos")]}</div>
              <div className={s.value}>{content[changaLang("count")]}</div>
            </div>
          </div>
          {!videos?.[3]?.active ? (
            <div className={s.login}>
              <div className={s.login_label}>
                {content[changaLang("login_text")]}
              </div>
              <MyButton onClick={() => navigate("/login")}>Login</MyButton>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </Container>
  );
};

export default TraningVideoPage;