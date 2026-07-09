import React, { ReactNode, ReactElement } from "react";

interface TodoHeaderProps {
  children: ReactNode;
  loading?: boolean;
}

function TodoHeader({ children, loading }: TodoHeaderProps) {
  return (
    

    <header>
          {React.Children
            .toArray(children)
            .map(child =>
              React.cloneElement(child as ReactElement<any>, { loading })
            )
          }
    </header>
  );
}

export { TodoHeader };