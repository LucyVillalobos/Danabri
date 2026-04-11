import { CartProvider } from "./components/CartContext";
import POS from "./pages/POS";
import "./App.css";

function App() {
  return (
    <CartProvider>
      <POS />
    </CartProvider>
  );
}

export default App;