"use client";

import { useDispatch, useSelector } from "react-redux";
import TimeIcon from "../../svg/Tiime";
import s from "./PlayListIndividualTraining.module.scss";
import cn from "classnames";
import { treningSubCategoryActions } from "../../../store/trening/treningSubCatSlice";
import { useLocalizedText } from "../../../hook/useLocalizedText";
import { IndividualTreningVideoActions } from "../../../store/individualTraining/IndividualTreningVideo";


const PlayListIndividualTraining = ({ title, videos, ...props }: any) => {
  const dispatch = useDispatch<any>();
  const changLang = useLocalizedText();
  const selected_video = useSelector(
    (state: any) => state.IndividualTreningVideo.selected_video
  );
  return (
    <div {...props} className={s.wrapper}>
      <h4 className={s.title}>{title}</h4>
      <ul className={s.list}>
        {videos.length &&
          videos.map((el) => (
            <button
              key={el.id}
              style={!el.active ? { opacity: 0.5 } : {}}
              className={cn(s.item)}
              onClick={() => {
                if (el.active) {
                  dispatch(IndividualTreningVideoActions.setSelectedVideo(el));
                }
              }}
            >
              <span className={s.icon}>
                {el.id === selected_video?.id ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                  >
                    <path
                      d="M14 28C6.26801 28 0 21.7319 0 14C0 6.26801 6.26801 0 14 0C21.7319 0 28 6.26801 28 14C28 21.7319 21.7319 28 14 28ZM9.8 9.8V18.2H12.6V9.8H9.8ZM15.4 9.8V18.2H18.2V9.8H15.4Z"
                      fill="#65926B"
                    />
                  </svg>
                ) : (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="14" cy="14" r="14" fill="#65926B" />
                    <path
                      d="M18.918 14.2772L11.8522 18.9877C11.699 19.0899 11.4921 19.0485 11.39 18.8953C11.3535 18.8405 11.334 18.7762 11.334 18.7104V9.28939C11.334 9.10529 11.4832 8.95605 11.6673 8.95605C11.7331 8.95605 11.7975 8.97553 11.8522 9.01204L18.918 13.7225C19.0711 13.8247 19.1125 14.0316 19.0104 14.1848C18.986 14.2214 18.9546 14.2528 18.918 14.2772Z"
                      fill="white"
                    />
                  </svg>
                )}
              </span>

              <div className={s.name}>{el[changLang("title")]}</div>

              <div className={s.time}>
                <span className={s.time_icon}>
                  {!el.active ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M5 6.66671V5.83337C5 3.07195 7.23857 0.833374 10 0.833374C12.7614 0.833374 15 3.07195 15 5.83337V6.66671H16.6667C17.1269 6.66671 17.5 7.03981 17.5 7.50004V17.5C17.5 17.9603 17.1269 18.3334 16.6667 18.3334H3.33333C2.8731 18.3334 2.5 17.9603 2.5 17.5V7.50004C2.5 7.03981 2.8731 6.66671 3.33333 6.66671H5ZM15.8333 8.33337H4.16667V16.6667H15.8333V8.33337ZM9.16667 13.1104C8.6685 12.8222 8.33333 12.2836 8.33333 11.6667C8.33333 10.7462 9.0795 10 10 10C10.9205 10 11.6667 10.7462 11.6667 11.6667C11.6667 12.2836 11.3315 12.8222 10.8333 13.1104V15H9.16667V13.1104ZM6.66667 6.66671H13.3333V5.83337C13.3333 3.99242 11.8409 2.50004 10 2.50004C8.15905 2.50004 6.66667 3.99242 6.66667 5.83337V6.66671Z"
                        fill="#5E5E5E"
                      />
                    </svg>
                  ) : (
                    ""
                  )}
                  <TimeIcon />
                </span>
                <div className={s.time_number}>{el.duration}</div>
              </div>
            </button>
          ))}
      </ul>
    </div>
  );
};

export default PlayListIndividualTraining;