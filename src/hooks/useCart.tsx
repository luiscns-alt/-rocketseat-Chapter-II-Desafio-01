import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const upDatedCart = [...cart]; //adicionando produtos a variavel upDatedCart

      const productExists = upDatedCart.find(
        (product) => product.id === productId
      ); //verificando se o produto existe no carrinho

      const stock = await api.get(`/stock/${productId}`); //verificando  produtos no  stock   api

      const stokAmount = stock.data.amount; // verificando quantidade de produtos

      const currentAmount = productExists ? productExists.amount : 0; //guardando quantidade de produtos

      const amount = currentAmount + 1; //quantidade desejada

      //verificando quantidades no estoque
      if (amount > stokAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      //verificando se o produto existe
      if (productExists) {
        productExists.amount = amount; //se existir o produto e atualiza o productExists
      } else {
        const product = await api.get(`/products/${productId}`); //buscando o produto na api e adicionando ao carrinho

        const newProduct = {
          ...product.data,
          amount: 1,
        };

        upDatedCart.push(newProduct);
      }

      setCart(upDatedCart); //perpetuando as alteracoes
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(upDatedCart)); //adicionando a localstorege
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const upDatedCart = [...cart]; // adicionando produtos a variavel upDatedCart

      const productIndex = upDatedCart.findIndex(
        (product) => product.id === productId
      ); //obtendo produto por id

      if (productIndex >= 0) {
        upDatedCart.splice(productIndex, 1);
        setCart(upDatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(upDatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return; //saindo da funcao
      }

      const stock = await api.get(`/stock/${productId}`); //verificando stock

      const stockAmount = stock.data.amount;

      // verificando se a quantidade desejada e maior do que o stock
      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const upDatedCart = [...cart]; //

      const productExists = upDatedCart.find(
        (product) => product.id === productId
      ); //obtendo o produto id

      //verificando se o produto existe
      if (productExists) {
        productExists.amount = amount;
        setCart(upDatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(upDatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
