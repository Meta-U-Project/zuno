import { formatMarkdown } from '../utils/markdownFormatter';

const FormattedMessage = ({ content }) => {
    const formattedContent = formatMarkdown(content);
    
    return (
        <div 
            className="formatted-message"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
    );
};

export default FormattedMessage;