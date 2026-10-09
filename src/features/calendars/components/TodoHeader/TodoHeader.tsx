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
              React.isValidElement(child) && typeof child.type !== 'string'
                ? React.cloneElement(child as ReactElement<any>, { loading })
                : child
            )
          }
    </header>
  );
}

export { TodoHeader };
