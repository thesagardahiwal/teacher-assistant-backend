

interface Props {
    status: number;
    message: string;
    data: any;
    success: boolean;
}

export const response = (props : Props) : Props => ({
  ...props
});