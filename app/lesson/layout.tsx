type props = {
  children: React.ReactNode;
};

const LessonLayout = ({ children }: props) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col h-full w-full">{children}</div>
    </div>
  );
};

export default LessonLayout;
