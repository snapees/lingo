"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { useEffect, useState, useTransition } from "react";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { reduceHearts } from "@/actions/user-progress";

type Props = {
  initialPercentage: number;
  initialHearts: number;
  initailLessonId: number;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  })[];
  userSubscription: any; // TODO: Replace with subscription db type
};

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initailLessonId,
  initialLessonChallenges,
  userSubscription,
}: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [hearts, setHearts] = useState(initialHearts);
  const [percentage, setPercentage] = useState(initialPercentage);
  const [challenges] = useState(initialLessonChallenges);
  const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = challenges.findIndex(
      (challenge) => !challenge.completed
    );
    return uncompletedIndex === -1 ? 0 : uncompletedIndex;
  });

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"correct" | "wrong" | "none">("none");

  const challenge = challenges[activeIndex];
  const options = challenge?.challengeOptions || [];

  const [completed, setCompleted] = useState(false); // TODO: Replace with challenge db type

  const onNext = () => {
    // setActiveIndex((current) => current + 1);
    setActiveIndex((current) => {
      if (current >= challenges.length - 1) {
        // Handle the case where we've reached the last challenge
        // You can add logic here to navigate to the next lesson or unit
        setCompleted(true);
        return current;
      }
      return current + 1;
    });
  };

  useEffect(() => {
    if (completed) {
      router.push("/learn");
    }
  }, [completed, router]);

  const onSelect = (id: number) => {
    if (status !== "none") {
      return;
    }

    setSelectedOption(id);
  };

  const onContinue = () => {
    if (!selectedOption) return;

    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    if (status === "correct") {
      onNext();
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    const correctOption = options.find((option) => option.correct);

    if (!correctOption) return;

    if (correctOption.id === selectedOption) {
      startTransition(() => {
        upsertChallengeProgress(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              console.error("Missing Hearts");
              return;
            }

            setStatus("correct");
            setPercentage((prev) => prev + 100 / challenges.length);

            // this is a practice
            if (initialPercentage === 100) {
              setHearts((prev) => Math.min(prev + 1, 5));
            }
          })
          .catch(() => toast.error("Something went wrong. Please try again!"));
      });
    } else {
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              console.error("Missing Hearts");
              return;
            }

            setStatus("wrong");

            if (!response?.error) {
              setHearts((prev) => Math.max(prev - 1, 0));
            }
          })
          .catch(() => toast.error("Something went wrong. Please try again!"));
      });
    }
  };

  const title =
    challenge.type === "ASSIST"
      ? "Select the Correct Meaning"
      : challenge.question;

  return (
    <>
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
        // hasActiveSubscription={true}
      />

      <div className="flex-1">
        <div className="flex h-full items-center justify-center">
          <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 flex flex-col gap-y-12">
            <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
              {title}
            </h1>

            <div>
              {challenge.type === "ASSIST" && (
                <QuestionBubble question={challenge.question} />
              )}

              <Challenge
                options={options}
                onSelect={onSelect}
                status={status}
                selectedOption={selectedOption}
                disabled={pending}
                type={challenge.type}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer
        disabled={pending || !selectedOption}
        status={status}
        onCheck={onContinue}
      />
    </>
  );
};
